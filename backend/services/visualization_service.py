import os

import numpy as np

from config import Config


CACHE_VERSION = 1


def _cache_path(index_id):
    return os.path.join(Config.VISUALIZATION_FOLDER, f"{index_id}.npz")


def _build_projection(vectors):
    vectors = np.asarray(vectors, dtype=np.float32)
    if vectors.ndim != 2 or vectors.shape[0] == 0:
        raise ValueError("Visualization requires a non-empty 2D array")

    n_cells, n_features = vectors.shape
    if n_features >= 3:
        from sklearn.decomposition import PCA

        pca = PCA(n_components=2, random_state=42)
        coords = pca.fit_transform(vectors).astype(np.float32)
        projection = {
            "type": "pca",
            "mean": pca.mean_.astype(np.float32),
            "components": pca.components_.astype(np.float32),
        }
    elif n_features == 2:
        coords = vectors.astype(np.float32)
        projection = {"type": "identity"}
    else:
        coords = np.column_stack([vectors[:, 0], np.zeros(n_cells, dtype=np.float32)]).astype(np.float32)
        projection = {"type": "raw_1d"}

    if n_cells == 1:
        labels = np.zeros(1, dtype=np.int32)
        centers = coords.astype(np.float32)
    else:
        from sklearn.cluster import MiniBatchKMeans

        cluster_count = min(8, max(2, int(np.sqrt(n_cells / 10000.0)) + 3))
        cluster_count = min(cluster_count, n_cells)
        if cluster_count < 2:
            labels = np.zeros(n_cells, dtype=np.int32)
            centers = coords[:1].astype(np.float32)
        else:
            model = MiniBatchKMeans(
                n_clusters=cluster_count,
                random_state=42,
                batch_size=min(1024, n_cells),
                n_init=10,
            )
            labels = model.fit_predict(coords).astype(np.int32)
            centers = model.cluster_centers_.astype(np.float32)

    return coords, labels, centers, projection


def _save_cache(cache_path, coords, labels, centers, projection):
    os.makedirs(Config.VISUALIZATION_FOLDER, exist_ok=True)
    payload = {
        "version": np.array(CACHE_VERSION, dtype=np.int32),
        "coords": coords.astype(np.float32),
        "labels": labels.astype(np.int32),
        "centers": centers.astype(np.float32),
        "projection_type": np.array(projection["type"]),
    }
    if projection.get("mean") is not None:
        payload["pca_mean"] = projection["mean"].astype(np.float32)
    if projection.get("components") is not None:
        payload["pca_components"] = projection["components"].astype(np.float32)
    np.savez_compressed(cache_path, **payload)


def _load_cache(cache_path):
    if not os.path.exists(cache_path):
        return None

    with np.load(cache_path, allow_pickle=False) as data:
        version = int(data["version"]) if "version" in data else 0
        if version != CACHE_VERSION:
            return None
        projection = {"type": str(data["projection_type"]) if "projection_type" in data else "identity"}
        if "pca_mean" in data:
            projection["mean"] = data["pca_mean"].astype(np.float32)
        if "pca_components" in data:
            projection["components"] = data["pca_components"].astype(np.float32)
        return {
            "coords": data["coords"].astype(np.float32),
            "labels": data["labels"].astype(np.int32),
            "centers": data["centers"].astype(np.float32),
            "projection": projection,
        }


def get_visualization_cache(index_id, vectors):
    cache_path = _cache_path(index_id)
    cached = _load_cache(cache_path)
    if cached is not None:
        return cached

    coords, labels, centers, projection = _build_projection(vectors)
    _save_cache(cache_path, coords, labels, centers, projection)
    return {
        "coords": coords,
        "labels": labels,
        "centers": centers,
        "projection": projection,
    }


def _project_query_vector(query_vector, projection):
    query = np.asarray(query_vector, dtype=np.float32).ravel()

    if projection["type"] == "pca" and "mean" in projection and "components" in projection:
        centered = query - projection["mean"]
        xy = centered @ projection["components"].T
        return float(xy[0]), float(xy[1])

    if query.shape[0] >= 2:
        return float(query[0]), float(query[1])
    if query.shape[0] == 1:
        return float(query[0]), 0.0
    return 0.0, 0.0


def _nearest_cluster(x, y, centers):
    if centers is None or len(centers) == 0:
        return 0
    center_array = np.asarray(centers, dtype=np.float32)
    deltas = center_array - np.array([x, y], dtype=np.float32)
    distances = np.sum(deltas * deltas, axis=1)
    return int(np.argmin(distances))


def build_visualization_payload(index_id, vectors, cell_names, cell_metadata, query_vector=None, query_cell=None):
    cache = get_visualization_cache(index_id, vectors)
    coords = cache["coords"].astype(np.float32)
    labels = cache["labels"].astype(np.int32)
    centers = cache["centers"].astype(np.float32)
    projection = cache["projection"]

    points = []
    for idx, (coord, cluster_id) in enumerate(zip(coords, labels)):
        point = {
            "x": float(coord[0]),
            "y": float(coord[1]),
            "cluster": int(cluster_id),
            "cell_id": idx,
            "cell_name": cell_names[idx] if idx < len(cell_names) else f"cell_{idx}",
        }
        if idx < len(cell_metadata) and isinstance(cell_metadata[idx], dict):
            point.update(cell_metadata[idx])
        points.append(point)

    query_point = None
    if query_vector is not None:
        qx, qy = _project_query_vector(query_vector, projection)
        query_point = {
            "x": qx,
            "y": qy,
            "cluster": _nearest_cluster(qx, qy, centers),
            "cell_id": query_cell.get("cell_id") if isinstance(query_cell, dict) else None,
            "cell_name": query_cell.get("cell_name") if isinstance(query_cell, dict) else None,
        }
        if isinstance(query_cell, dict):
            for key in ("cell_type", "disease", "AgeGroup", "donor_id"):
                if query_cell.get(key) is not None:
                    query_point[key] = query_cell[key]

    return {
        "projection": projection["type"],
        "cluster_count": int(len(np.unique(labels))) if len(labels) else 0,
        "points": points,
        "query_point": query_point,
    }
