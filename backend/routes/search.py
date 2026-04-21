import json
import os
import time
import uuid
from datetime import datetime

import numpy as np
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config import Config
from services.ann_service import (
    search_faiss_index,
    search_annoy_index,
    load_faiss_index,
    load_annoy_index,
    normalize_vectors,
)

search_bp = Blueprint("search", __name__, url_prefix="/api/search")

MAX_HISTORY = 10


def _read_index_db():
    if not os.path.exists(Config.INDEX_DB_PATH):
        return {}
    try:
        with open(Config.INDEX_DB_PATH, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def _load_dataset_array(dataset_id):
    np_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}.npy")
    meta_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}_meta.json")
    if not os.path.exists(np_path):
        return None, None, None
    array = np.load(np_path)
    with open(meta_path, "r") as f:
        meta = json.load(f)
    return array, meta["cell_names"], meta["feature_names"]


def _read_history():
    if not os.path.exists(Config.SEARCH_HISTORY_PATH):
        return {}
    try:
        with open(Config.SEARCH_HISTORY_PATH, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def _write_history(data):
    os.makedirs(os.path.dirname(Config.SEARCH_HISTORY_PATH), exist_ok=True)
    with open(Config.SEARCH_HISTORY_PATH, "w") as f:
        json.dump(data, f, indent=2)


def _add_to_history(user_id, entry):
    history = _read_history()
    user_history = history.get(user_id, [])
    user_history.insert(0, entry)
    history[user_id] = user_history[:MAX_HISTORY]
    _write_history(history)


def _run_search(index_meta, query_vector, k):
    """Load index and perform ANN search. Returns (distances, indices, query_time_ms)."""
    index_type = index_meta["index_type"]
    index_path = index_meta["index_path"]
    metric = index_meta["metric"]
    n_features = index_meta["n_features"]
    n_cells = index_meta["n_cells"]

    query = np.array(query_vector, dtype=np.float32)
    if len(query) != n_features:
        raise ValueError(f"Query vector length {len(query)} does not match index features {n_features}")

    if metric == "cosine":
        query = normalize_vectors(query.reshape(1, -1))[0]

    start = time.time()
    if index_type == "annoy":
        idx = load_annoy_index(index_path, n_features, metric)
        distances, indices = search_annoy_index(idx, query.tolist(), k, n_cells)
    else:
        idx = load_faiss_index(index_path)
        distances, indices = search_faiss_index(idx, query, k)

    query_time_ms = round((time.time() - start) * 1000, 2)
    return distances, indices, query_time_ms


@search_bp.route("/query", methods=["POST"])
@jwt_required()
def query():
    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    index_id = body.get("index_id")
    query_vector = body.get("query_vector")
    k = int(body.get("k", 10))
    metric = body.get("metric")  # optional override display

    if not index_id:
        return jsonify({"error": "index_id is required"}), 400
    if query_vector is None:
        return jsonify({"error": "query_vector is required"}), 400
    if k < 1 or k > 1000:
        return jsonify({"error": "k must be between 1 and 1000"}), 400

    index_db = _read_index_db()
    index_meta = index_db.get(index_id)
    if not index_meta:
        return jsonify({"error": "Index not found"}), 404
    if index_meta["owner"] != user_id:
        return jsonify({"error": "Forbidden"}), 403

    _, cell_names, _ = _load_dataset_array(index_meta["dataset_id"])
    if cell_names is None:
        return jsonify({"error": "Dataset data not found"}), 404

    try:
        distances, indices, query_time_ms = _run_search(index_meta, query_vector, k)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

    results = []
    for rank, (dist, idx) in enumerate(zip(distances, indices), start=1):
        cell_name = cell_names[idx] if 0 <= idx < len(cell_names) else f"cell_{idx}"
        results.append({
            "rank": rank,
            "cell_id": idx,
            "cell_name": cell_name,
            "distance": float(dist),
        })

    _add_to_history(user_id, {
        "id": str(uuid.uuid4()),
        "type": "vector",
        "index_id": index_id,
        "k": k,
        "query_time_ms": query_time_ms,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return jsonify({
        "results": results,
        "query_time_ms": query_time_ms,
        "k": k,
        "metric": metric or index_meta["metric"],
    })


@search_bp.route("/query_by_id", methods=["POST"])
@jwt_required()
def query_by_id():
    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    index_id = body.get("index_id")
    cell_id = body.get("cell_id")
    k = int(body.get("k", 10))

    if not index_id:
        return jsonify({"error": "index_id is required"}), 400
    if cell_id is None:
        return jsonify({"error": "cell_id is required"}), 400

    index_db = _read_index_db()
    index_meta = index_db.get(index_id)
    if not index_meta:
        return jsonify({"error": "Index not found"}), 404
    if index_meta["owner"] != user_id:
        return jsonify({"error": "Forbidden"}), 403

    array, cell_names, _ = _load_dataset_array(index_meta["dataset_id"])
    if array is None:
        return jsonify({"error": "Dataset data not found"}), 404

    # Resolve cell_id: try as integer index first, then as name
    if isinstance(cell_id, int) or (isinstance(cell_id, str) and cell_id.isdigit()):
        idx = int(cell_id)
    else:
        if cell_id in cell_names:
            idx = cell_names.index(cell_id)
        else:
            return jsonify({"error": f"Cell '{cell_id}' not found in dataset"}), 404

    if idx < 0 or idx >= array.shape[0]:
        return jsonify({"error": f"Cell index {idx} out of range"}), 400

    query_vector = array[idx].tolist()

    try:
        distances, indices, query_time_ms = _run_search(index_meta, query_vector, k + 1)
    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

    results = []
    rank = 1
    for dist, i in zip(distances, indices):
        if int(i) == idx:
            continue  # skip the query cell itself
        cell_name = cell_names[i] if 0 <= i < len(cell_names) else f"cell_{i}"
        results.append({
            "rank": rank,
            "cell_id": int(i),
            "cell_name": cell_name,
            "distance": float(dist),
        })
        rank += 1
        if rank > k:
            break

    _add_to_history(user_id, {
        "id": str(uuid.uuid4()),
        "type": "cell_id",
        "index_id": index_id,
        "cell_id": str(cell_id),
        "k": k,
        "query_time_ms": query_time_ms,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return jsonify({
        "results": results,
        "query_time_ms": query_time_ms,
        "k": k,
        "metric": index_meta["metric"],
        "query_cell": cell_names[idx] if idx < len(cell_names) else str(idx),
    })


@search_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    hist = _read_history()
    return jsonify(hist.get(user_id, []))
