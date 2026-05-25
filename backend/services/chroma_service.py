import os
import time
from config import Config

try:
    import chromadb
    from chromadb.config import Settings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

_client = None


def get_client():
    global _client
    if not CHROMA_AVAILABLE:
        raise RuntimeError("chromadb is not installed")
    if _client is None:
        os.makedirs(Config.CHROMA_PATH, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=Config.CHROMA_PATH,
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def _hnsw_space(metric):
    """Map metric name to ChromaDB HNSW space parameter."""
    mapping = {"cosine": "cosine", "l2": "l2", "ip": "ip"}
    return mapping.get(metric, "cosine")


def _sanitize_metadata(meta):
    """Ensure all metadata values are valid ChromaDB types (str, int, float, bool)."""
    clean = {}
    for k, v in (meta or {}).items():
        if v is None or v == "":
            continue
        if isinstance(v, (str, int, float, bool)):
            clean[k] = v
        else:
            clean[k] = str(v)
    return clean


def create_collection(collection_name, vectors, metadatas, ids, metric="cosine"):
    """Create a ChromaDB collection with HNSW index and add all vectors.

    Returns build_time in seconds.
    """
    client = get_client()

    start = time.time()
    collection = client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": _hnsw_space(metric)},
    )

    clean_metadatas = [_sanitize_metadata(m) for m in metadatas]

    batch_size = 5000
    for i in range(0, len(ids), batch_size):
        end = min(i + batch_size, len(ids))
        collection.add(
            ids=ids[i:end],
            embeddings=vectors[i:end],
            metadatas=clean_metadatas[i:end],
        )

    build_time = round(time.time() - start, 2)
    return build_time


def search_collection(collection_name, query_vector, k, filters=None):
    """Search a ChromaDB collection with optional metadata filtering.

    Returns (results, query_time_ms).
    """
    client = get_client()
    collection = client.get_collection(name=collection_name)

    where = None
    if filters:
        where = _build_filter(filters)

    start = time.time()
    result = collection.query(
        query_embeddings=[list(query_vector)],
        n_results=k,
        where=where,
        include=["metadatas", "distances"],
    )
    query_time_ms = round((time.time() - start) * 1000, 2)

    results = []
    if result["ids"] and result["ids"][0]:
        for rank, (cell_id, meta, dist) in enumerate(
            zip(result["ids"][0], result["metadatas"][0], result["distances"][0]), start=1
        ):
            entry = {
                "rank": rank,
                "cell_id": cell_id,
                "distance": float(dist),
            }
            if meta:
                entry["cell_name"] = meta.get("cell_name", cell_id)
                entry["cell_type"] = meta.get("cell_type", "")
                entry["disease"] = meta.get("disease", "")
                entry["AgeGroup"] = meta.get("AgeGroup", "")
                entry["donor_id"] = meta.get("donor_id", "")
                entry["dataset_source"] = meta.get("dataset_source", "")
                entry["dataset_id"] = meta.get("dataset_id", "")
            results.append(entry)

    return results, query_time_ms


def _build_filter(filters):
    """Convert simple {field: value} dict to ChromaDB where syntax."""
    if not filters:
        return None
    filter_count = sum(1 for v in filters.values() if v is not None)
    if filter_count == 0:
        return None
    if filter_count == 1:
        for field, value in filters.items():
            if value is not None:
                return {field: {"$eq": str(value)}}
        return None

    clauses = []
    for field, value in filters.items():
        if value is not None:
            clauses.append({field: {"$eq": str(value)}})
    return {"$and": clauses} if clauses else None


def delete_collection(collection_name):
    """Delete a ChromaDB collection by name."""
    try:
        client = get_client()
        client.delete_collection(name=collection_name)
    except Exception:
        pass
