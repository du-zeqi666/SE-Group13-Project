import os
import time
import math
import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

try:
    from annoy import AnnoyIndex
    ANNOY_AVAILABLE = True
except ImportError:
    ANNOY_AVAILABLE = False


def normalize_vectors(vectors):
    """L2-normalize rows of a 2D numpy array."""
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    return (vectors / norms).astype(np.float32)


def build_faiss_index(vectors, index_type="faiss_flat", metric="l2"):
    """Build a FAISS index from numpy vectors."""
    if not FAISS_AVAILABLE:
        raise RuntimeError("faiss-cpu is not installed")

    vectors = np.array(vectors, dtype=np.float32)
    if metric == "cosine":
        vectors = normalize_vectors(vectors)

    n, d = vectors.shape

    if index_type == "faiss_flat":
        if metric in ("cosine", "ip"):
            index = faiss.IndexFlatIP(d)
        else:
            index = faiss.IndexFlatL2(d)
    elif index_type == "faiss_ivf":
        nlist = max(1, min(100, int(math.sqrt(n))))
        if n < 2 * nlist:
            # Fall back to flat when not enough vectors for IVF
            if metric in ("cosine", "ip"):
                index = faiss.IndexFlatIP(d)
            else:
                index = faiss.IndexFlatL2(d)
        else:
            if metric in ("cosine", "ip"):
                quantizer = faiss.IndexFlatIP(d)
                index = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_INNER_PRODUCT)
            else:
                quantizer = faiss.IndexFlatL2(d)
                index = faiss.IndexIVFFlat(quantizer, d, nlist)
            index.train(vectors)
    else:
        raise ValueError(f"Unknown faiss index_type: {index_type}")

    index.add(vectors)
    return index


def build_annoy_index(vectors, metric="l2", n_trees=10):
    """Build an Annoy index from numpy vectors."""
    if not ANNOY_AVAILABLE:
        raise RuntimeError("annoy is not installed")

    vectors = np.array(vectors, dtype=np.float32)
    _, d = vectors.shape

    annoy_metric = "euclidean" if metric == "l2" else "angular" if metric == "cosine" else "dot"
    idx = AnnoyIndex(d, annoy_metric)
    for i, v in enumerate(vectors):
        idx.add_item(i, v.tolist())
    idx.build(n_trees)
    return idx


def search_faiss_index(index, query_vector, k):
    """Search a FAISS index. Returns (distances, indices)."""
    query = np.array(query_vector, dtype=np.float32).reshape(1, -1)
    k = min(k, index.ntotal)
    distances, indices = index.search(query, k)
    return distances[0].tolist(), indices[0].tolist()


def search_annoy_index(index, query_vector, k, n_total):
    """Search an Annoy index. Returns (distances, indices)."""
    k = min(k, n_total)
    indices, distances = index.get_nns_by_vector(query_vector, k, include_distances=True)
    return distances, indices


def save_faiss_index(index, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    faiss.write_index(index, path)


def load_faiss_index(path):
    return faiss.read_index(path)


def save_annoy_index(index, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    index.save(path)


def load_annoy_index(path, n_features, metric="l2"):
    annoy_metric = "euclidean" if metric == "l2" else "angular" if metric == "cosine" else "dot"
    idx = AnnoyIndex(n_features, annoy_metric)
    idx.load(path)
    return idx
