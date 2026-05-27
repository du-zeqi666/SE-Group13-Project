import os
import re
import uuid
import traceback
from datetime import datetime

import numpy as np
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from config import Config
from models import db
from models.metadata import Dataset, SearchHistory, SearchIndex, JointIndexDataset
from services.data_service import (
    load_csv,
    load_h5,
    load_h5ad_umap,
    validate_data,
    generate_random_data,
    normalize_l2,
    standardize,
)

_UUID_RE = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')


def _valid_uuid(value):
    return bool(_UUID_RE.match(str(value)))

data_bp = Blueprint("data", __name__, url_prefix="/api/data")

ALLOWED_EXTENSIONS = {".csv", ".tsv", ".h5", ".h5ad"}
SCATTER_CACHE_VERSION = 3


def _save_numpy(array, cell_names, feature_names, dataset_id, cell_metadata=None):
    np_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}.npy")
    meta_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}_meta.json")
    np.save(np_path, array)
    with open(meta_path, "w") as f:
        import json
        json.dump(
            {
                "cell_names": cell_names,
                "feature_names": feature_names,
                "cell_metadata": cell_metadata or [{} for _ in range(len(cell_names))],
            },
            f,
            ensure_ascii=False,
        )
    return np_path


def _is_managed_upload_path(path):
    if not path:
        return False
    try:
        return os.path.commonpath([os.path.abspath(path), os.path.abspath(Config.UPLOAD_FOLDER)]) == os.path.abspath(Config.UPLOAD_FOLDER)
    except ValueError:
        return False


def _create_dataset_record(dataset_id, name, owner_id, array, cell_names, feature_names, original_file=None, status="ready"):
    dataset = Dataset.create(
        id=dataset_id,
        name=name,
        owner_id=owner_id,
        shape_rows=array.shape[0],
        shape_cols=array.shape[1],
        cell_count=array.shape[0],
        feature_count=array.shape[1],
        cell_names_preview=cell_names[:5],
        feature_names_preview=feature_names[:5],
        original_file=original_file,
        status=status,
        created_at=datetime.utcnow(),
    )
    db.session.add(dataset)
    db.session.commit()
    return dataset


def _load_file_by_extension(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    if ext in (".h5", ".h5ad"):
        return load_h5(file_path)
    return load_csv(file_path)


def _resolve_local_data_path(path_value):
    raw_path = (path_value or "").strip()
    if not raw_path:
        raise ValueError("path is required")

    candidate = raw_path
    if not os.path.isabs(candidate):
        candidate = os.path.abspath(os.path.join(Config.DATA_ROOT, candidate))
    else:
        candidate = os.path.abspath(candidate)

    data_root = os.path.abspath(Config.DATA_ROOT)
    try:
        inside_root = os.path.commonpath([candidate, data_root]) == data_root
    except ValueError:
        inside_root = False
    if not inside_root:
        raise ValueError("Only files inside the local data directory are allowed")
    if not os.path.exists(candidate):
        raise FileNotFoundError("Local dataset file not found")

    return candidate


def _list_local_importable_files():
    candidates = []
    for root, _, files in os.walk(Config.DATA_ROOT):
        for file_name in files:
            ext = os.path.splitext(file_name)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                continue
            absolute_path = os.path.join(root, file_name)
            relative_path = os.path.relpath(absolute_path, Config.DATA_ROOT).replace("\\", "/")
            candidates.append(relative_path)
    candidates.sort()
    return candidates


def _load_dataset_array(dataset_id):
    if not _valid_uuid(dataset_id):
        return None, None, None
    safe_id = os.path.basename(dataset_id)
    np_path = os.path.join(Config.UPLOAD_FOLDER, f"{safe_id}.npy")
    meta_path = os.path.join(Config.UPLOAD_FOLDER, f"{safe_id}_meta.json")
    if not os.path.exists(np_path):
        return None, None, None
    array = np.load(np_path)
    with open(meta_path, "r") as f:
        import json
        meta = json.load(f)
    return array, meta["cell_names"], meta["feature_names"], meta.get("cell_metadata", [{} for _ in range(array.shape[0])])


def _scatter_cache_path(dataset_id, method="pca"):
    safe_method = (method or "pca").lower()
    return os.path.join(Config.VISUALIZATION_FOLDER, f"dataset_{dataset_id}_{safe_method}.npz")


def _build_dataset_scatter(array):
    array = np.asarray(array, dtype=np.float32)
    if array.ndim != 2 or array.shape[0] == 0:
        raise ValueError("Dataset must be a non-empty 2D array")

    n_cells, n_features = array.shape
    if n_features >= 2:
        coords = array[:, :2].astype(np.float32)
    elif n_features == 2:
        coords = array.astype(np.float32)
    else:
        coords = np.column_stack([array[:, 0], np.zeros(n_cells, dtype=np.float32)]).astype(np.float32)

    labels, centers = _cluster_coords(coords)

    return coords, labels, centers


def _load_or_build_dataset_scatter(dataset_id):
    # default to PCA-based cache
    return _load_or_build_dataset_scatter_method(dataset_id, method="pca")


def _cluster_coords(coords):
    coords = np.asarray(coords, dtype=np.float32)
    n_cells = coords.shape[0]
    if n_cells <= 1:
        return np.zeros(n_cells, dtype=np.int32), coords[: max(1, n_cells)].astype(np.float32)

    from sklearn.cluster import MiniBatchKMeans

    cluster_count = min(8, max(2, int(np.sqrt(n_cells / 10000.0)) + 3))
    cluster_count = min(cluster_count, n_cells)
    if cluster_count < 2:
        return np.zeros(n_cells, dtype=np.int32), coords[:1].astype(np.float32)

    model = MiniBatchKMeans(
        n_clusters=cluster_count,
        random_state=42,
        batch_size=min(1024, n_cells),
        n_init=10,
    )
    labels = model.fit_predict(coords).astype(np.int32)
    centers = model.cluster_centers_.astype(np.float32)
    return labels, centers


def _extract_umap_from_cell_metadata(cell_metadata, expected_rows):
    if not cell_metadata or len(cell_metadata) < expected_rows:
        return None

    coords = np.zeros((expected_rows, 2), dtype=np.float32)
    for i in range(expected_rows):
        entry = cell_metadata[i] if i < len(cell_metadata) and isinstance(cell_metadata[i], dict) else None
        if not entry or "umap_1" not in entry or "umap_2" not in entry:
            return None
        try:
            coords[i, 0] = float(entry["umap_1"])
            coords[i, 1] = float(entry["umap_2"])
        except Exception:
            return None

    return coords


def _load_or_build_dataset_scatter_method(dataset_id, method="pca"):
    method = (method or "pca").lower()
    cache_path = _scatter_cache_path(dataset_id, method=method)
    if os.path.exists(cache_path):
        try:
            with np.load(cache_path, allow_pickle=False) as data:
                version = int(data["version"]) if "version" in data else 0
                if version == SCATTER_CACHE_VERSION:
                    return {
                        "coords": data["coords"].astype(np.float32),
                        "labels": data["labels"].astype(np.int32),
                        "centers": data["centers"].astype(np.float32),
                    }
        except Exception:
            try:
                os.remove(cache_path)
            except OSError:
                pass

    array, _, _, cell_metadata = _load_dataset_array(dataset_id)
    if array is None:
        return None

    if method == "umap":
        coords = _extract_umap_from_cell_metadata(cell_metadata, array.shape[0])

        if coords is None:
            dataset = Dataset.query.get(dataset_id)
            if dataset and dataset.original_file and str(dataset.original_file).lower().endswith(".h5ad") and os.path.exists(dataset.original_file):
                coords = load_h5ad_umap(dataset.original_file)

        if coords is None:
            # Fallback: if no precomputed UMAP exists, use first two dimensions for immediate plotting.
            coords = _build_dataset_scatter(array)[0]

        labels, centers = _cluster_coords(coords)
    else:
        # default: use first two features / PCA precomputed data
        coords, labels, centers = _build_dataset_scatter(array)

    os.makedirs(Config.VISUALIZATION_FOLDER, exist_ok=True)
    np.savez_compressed(
        cache_path,
        version=np.array(SCATTER_CACHE_VERSION, dtype=np.int32),
        coords=coords.astype(np.float32),
        labels=labels.astype(np.int32),
        centers=centers.astype(np.float32),
    )
    return {"coords": coords, "labels": labels, "centers": centers}


@data_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload():
    user_id = get_jwt_identity()
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    dataset_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename)
    upload_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}_{safe_name}")
    file.save(upload_path)

    try:
        array, cell_names, feature_names, cell_metadata = _load_file_by_extension(upload_path)

        validation = validate_data(array)
        if not validation["valid"]:
            os.remove(upload_path)
            return jsonify({"error": validation["message"]}), 422

        _save_numpy(array, cell_names, feature_names, dataset_id, cell_metadata=cell_metadata)
    except Exception:
        if os.path.exists(upload_path):
            os.remove(upload_path)
        return jsonify({"error": "Failed to parse file. Check format and content."}), 422

    _create_dataset_record(dataset_id, safe_name, user_id, array, cell_names, feature_names, original_file=upload_path)

    return jsonify({
        "dataset_id": dataset_id,
        "shape": list(array.shape),
        "cell_count": array.shape[0],
        "feature_count": array.shape[1],
        "message": "Dataset uploaded successfully",
    }), 201


@data_bp.route("/generate_demo", methods=["POST"])
@jwt_required()
def generate_demo():
    user_id = get_jwt_identity()
    array, cell_names, feature_names, cell_metadata = generate_random_data(1000, 50)

    dataset_id = str(uuid.uuid4())
    _save_numpy(array, cell_names, feature_names, dataset_id, cell_metadata=cell_metadata)

    _create_dataset_record(dataset_id, "demo_data.csv", user_id, array, cell_names, feature_names)

    return jsonify({
        "dataset_id": dataset_id,
        "shape": list(array.shape),
        "cell_count": array.shape[0],
        "feature_count": array.shape[1],
        "message": "Demo dataset generated (1000 cells × 50 features)",
    }), 201


@data_bp.route("/import_local", methods=["POST"])
@jwt_required()
def import_local_dataset():
    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    try:
        local_path = _resolve_local_data_path(body.get("path"))
        array, cell_names, feature_names, cell_metadata = _load_file_by_extension(local_path)
        validation = validate_data(array)
        if not validation["valid"]:
            return jsonify({"error": validation["message"]}), 422
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        return jsonify({"error": "Failed to import local dataset. Check format and content."}), 422

    dataset_id = str(uuid.uuid4())
    _save_numpy(array, cell_names, feature_names, dataset_id, cell_metadata=cell_metadata)

    dataset_name = (body.get("name") or os.path.basename(local_path)).strip() or os.path.basename(local_path)
    _create_dataset_record(
        dataset_id,
        dataset_name,
        user_id,
        array,
        cell_names,
        feature_names,
        original_file=local_path,
        status="ready (local import)",
    )

    return jsonify({
        "dataset_id": dataset_id,
        "shape": list(array.shape),
        "cell_count": array.shape[0],
        "feature_count": array.shape[1],
        "message": "Local dataset imported successfully",
        "path": os.path.relpath(local_path, Config.DATA_ROOT).replace("\\", "/"),
    }), 201


@data_bp.route("/local_files", methods=["GET"])
@jwt_required()
def list_local_files():
    return jsonify({"files": _list_local_importable_files()})


@data_bp.route("/datasets", methods=["GET"])
@jwt_required()
def list_datasets():
    user_id = get_jwt_identity()
    datasets = [
        dataset.to_summary_dict()
        for dataset in Dataset.query.filter_by(owner_id=user_id).order_by(Dataset.created_at.desc()).all()
    ]
    return jsonify(datasets)


@data_bp.route("/datasets/<dataset_id>", methods=["GET"])
@jwt_required()
def get_dataset(dataset_id):
    user_id = get_jwt_identity()
    ds = Dataset.query.filter_by(id=dataset_id, owner_id=user_id).first()
    if not ds:
        return jsonify({"error": "Dataset not found"}), 404
    return jsonify(ds.to_dict())


@data_bp.route("/datasets/<dataset_id>", methods=["DELETE"])
@jwt_required()
def delete_dataset(dataset_id):
    if not _valid_uuid(dataset_id):
        return jsonify({"error": "Invalid dataset ID"}), 400
    user_id = get_jwt_identity()
    ds = Dataset.query.filter_by(id=dataset_id, owner_id=user_id).first()
    if not ds:
        return jsonify({"error": "Dataset not found"}), 404

    # Prevent deletion if dataset is in an active joint index
    active_links = JointIndexDataset.query.filter_by(dataset_id=dataset_id).all()
    if active_links:
        joint_names = []
        for link in active_links:
            from models.metadata import JointIndex
            ji = JointIndex.query.get(link.joint_index_id)
            if ji:
                joint_names.append(ji.name)
        return jsonify({
            "error": f"Dataset is used in {len(active_links)} joint index(es): {', '.join(joint_names)}. Remove it from those joint indices first."
        }), 409

    index_ids = [index.id for index in ds.indices]
    for index in ds.indices:
        if index.index_path and os.path.exists(index.index_path):
            os.remove(index.index_path)
    if index_ids:
        SearchHistory.query.filter(SearchHistory.index_id.in_(index_ids)).delete(synchronize_session=False)

    safe_id = os.path.basename(dataset_id)
    for suffix in [".npy", "_meta.json"]:
        p = os.path.join(Config.UPLOAD_FOLDER, f"{safe_id}{suffix}")
        if os.path.exists(p):
            os.remove(p)
    if ds.original_file and _is_managed_upload_path(ds.original_file) and os.path.exists(ds.original_file):
        os.remove(ds.original_file)

    db.session.delete(ds)
    db.session.commit()
    return jsonify({"message": "Dataset deleted"})


@data_bp.route("/datasets/<dataset_id>/preprocess", methods=["POST"])
@jwt_required()
def preprocess_dataset(dataset_id):
    user_id = get_jwt_identity()
    ds = Dataset.query.filter_by(id=dataset_id, owner_id=user_id).first()
    if not ds:
        return jsonify({"error": "Dataset not found"}), 404

    body = request.get_json(silent=True) or {}
    method = body.get("method", "normalize")

    array, cell_names, feature_names, cell_metadata = _load_dataset_array(dataset_id)
    if array is None:
        return jsonify({"error": "Dataset data not found on disk"}), 404

    if method == "normalize":
        array = normalize_l2(array)
        label = "L2 normalized"
    elif method == "standardize":
        array = standardize(array)
        label = "Standardized"
    else:
        return jsonify({"error": f"Unknown method: {method}"}), 400

    _save_numpy(array.astype(np.float32), cell_names, feature_names, dataset_id, cell_metadata=cell_metadata)
    ds.status = f"preprocessed ({label})"
    db.session.commit()
    return jsonify({"message": f"Dataset preprocessed: {label}", "shape": list(array.shape)})


@data_bp.route("/datasets/<dataset_id>/scatter", methods=["GET"])
@jwt_required()
def dataset_scatter(dataset_id):
    user_id = get_jwt_identity()
    ds = Dataset.query.filter_by(id=dataset_id, owner_id=user_id).first()
    if not ds:
        return jsonify({"error": "Dataset not found"}), 404

    try:
        method = (request.args.get("method", "pca") or "pca").lower()
        try:
            max_points = int(request.args.get("max_points", str(Config.VISUALIZATION_MAX_POINTS)))
        except Exception:
            max_points = Config.VISUALIZATION_MAX_POINTS

        payload = _load_or_build_dataset_scatter_method(dataset_id, method=method)
    except Exception as exc:
        traceback.print_exc()
        return jsonify({
            "error": "Failed to build dataset scatter plot",
            "detail": str(exc),
        }), 500

    if payload is None:
        return jsonify({"error": "Dataset data not found on disk"}), 404

    array, cell_names, _, cell_metadata = _load_dataset_array(dataset_id)
    coords = payload["coords"].astype(np.float32)
    labels = payload["labels"].astype(np.int32)
    centers = payload["centers"].astype(np.float32)

    n_cells = coords.shape[0]
    sampled = False
    indices = np.arange(n_cells)
    if n_cells > max_points and max_points > 0:
        rng = np.random.RandomState(42)
        indices = rng.choice(n_cells, size=max_points, replace=False)
        indices = np.sort(indices)
        sampled = True

    points = []
    for out_idx, idx in enumerate(indices):
        coord = coords[idx]
        cluster_id = int(labels[idx]) if idx < len(labels) else 0
        point = {
            "x": float(coord[0]),
            "y": float(coord[1]),
            "cluster": int(cluster_id),
            "cell_id": int(idx),
            "cell_name": cell_names[idx] if idx < len(cell_names) else f"cell_{idx}",
        }
        if idx < len(cell_metadata) and isinstance(cell_metadata[idx], dict):
            point.update(cell_metadata[idx])
        points.append(point)

    return jsonify({
        "dataset_id": dataset_id,
        "dataset_name": ds.name,
        "shape": list(array.shape) if array is not None else None,
        "cluster_count": int(len(np.unique(labels))) if len(labels) else 0,
        "points": points,
        "centers": centers.tolist(),
        "method": method,
        "sampled": sampled,
        "returned_point_count": len(points),
        "original_point_count": n_cells,
    })
