import os
import time
import uuid
from datetime import datetime

import numpy as np
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config import Config
from models import db
from models.metadata import SearchHistory, SearchIndex
from services.ann_service import (
    search_faiss_index,
    search_annoy_index,
    load_faiss_index,
    load_annoy_index,
    normalize_vectors,
)

search_bp = Blueprint("search", __name__, url_prefix="/api/search")

MAX_HISTORY = 10
FILTER_FIELDS = ("cell_type", "disease", "AgeGroup", "donor_id")


def _load_dataset_array(dataset_id):
    np_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}.npy")
    meta_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}_meta.json")
    if not os.path.exists(np_path):
        return None, None, None
    import json
    array = np.load(np_path)
    with open(meta_path, "r") as f:
        meta = json.load(f)
    return array, meta["cell_names"], meta["feature_names"], meta.get("cell_metadata", [{} for _ in range(array.shape[0])])


def _cell_info(cell_names, cell_metadata, index):
    cell_name = cell_names[index] if 0 <= index < len(cell_names) else f"cell_{index}"
    info = {"cell_name": cell_name}
    if 0 <= index < len(cell_metadata) and isinstance(cell_metadata[index], dict):
        info.update(cell_metadata[index])
    return info


def _extract_filters(payload):
    raw_filters = payload.get("filters") or {}
    if not isinstance(raw_filters, dict):
        return {}

    filters = {}
    for field in FILTER_FIELDS:
        value = raw_filters.get(field)
        if value is None:
            continue
        value = str(value).strip()
        if value:
            filters[field] = value
    return filters


def _matches_filters(cell_info, filters):
    if not filters:
        return True

    for field, expected in filters.items():
        actual = cell_info.get(field)
        if actual is None:
            return False
        if str(actual).strip().lower() != expected.strip().lower():
            return False
    return True


def _search_limit(requested_k, total_cells, has_filters, exclude_self=False):
    if not has_filters:
        return requested_k + (1 if exclude_self else 0)
    base = max(requested_k * 20, 100)
    if exclude_self:
        base += 1
    return min(base, total_cells)


def _add_to_history(user_id, entry):
    history_entry = SearchHistory(
        id=entry["id"],
        user_id=user_id,
        entry_type=entry["type"],
        index_id=entry["index_id"],
        cell_id=entry.get("cell_id"),
        k=entry["k"],
        query_time_ms=entry["query_time_ms"],
        timestamp=datetime.utcnow(),
    )
    db.session.add(history_entry)
    db.session.flush()

    stale_entries = (
        SearchHistory.query.filter_by(user_id=user_id)
        .order_by(SearchHistory.timestamp.desc())
        .offset(MAX_HISTORY)
        .all()
    )
    for stale_entry in stale_entries:
        db.session.delete(stale_entry)

    db.session.commit()


def _run_search(index_meta, query_vector, k):
    """Load index and perform ANN search. Returns (distances, indices, query_time_ms)."""
    index_type = index_meta.index_type
    index_path = index_meta.index_path
    metric = index_meta.metric
    n_features = index_meta.n_features
    n_cells = index_meta.n_cells

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
    filters = _extract_filters(body)

    if not index_id:
        return jsonify({"error": "index_id is required"}), 400
    if query_vector is None:
        return jsonify({"error": "query_vector is required"}), 400
    if k < 1 or k > 1000:
        return jsonify({"error": "k must be between 1 and 1000"}), 400

    index_meta = SearchIndex.query.filter_by(id=index_id, owner_id=user_id).first()
    if not index_meta:
        return jsonify({"error": "Index not found"}), 404
    if metric and metric != index_meta.metric:
        return jsonify({"error": f"Index metric is '{index_meta.metric}'. Please use the same metric for search."}), 400

    _, cell_names, _, cell_metadata = _load_dataset_array(index_meta.dataset_id)
    if cell_names is None:
        return jsonify({"error": "Dataset data not found"}), 404

    try:
        distances, indices, query_time_ms = _run_search(
            index_meta,
            query_vector,
            _search_limit(k, index_meta.n_cells, bool(filters)),
        )
    except ValueError:
        return jsonify({"error": "Invalid query vector: dimension mismatch or bad values."}), 400
    except Exception:
        return jsonify({"error": "Search failed. Check index and query vector."}), 500

    results = []
    for rank, (dist, idx) in enumerate(zip(distances, indices), start=1):
        cell_info = _cell_info(cell_names, cell_metadata, idx)
        if not _matches_filters(cell_info, filters):
            continue
        results.append({
            "rank": len(results) + 1,
            "cell_id": idx,
            **cell_info,
            "distance": float(dist),
        })
        if len(results) >= k:
            break

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
        "metric": metric or index_meta.metric,
        "filters": filters,
    })


@search_bp.route("/query_by_id", methods=["POST"])
@jwt_required()
def query_by_id():
    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    index_id = body.get("index_id")
    cell_id = body.get("cell_id")
    k = int(body.get("k", 10))
    metric = body.get("metric")
    filters = _extract_filters(body)

    if not index_id:
        return jsonify({"error": "index_id is required"}), 400
    if cell_id is None:
        return jsonify({"error": "cell_id is required"}), 400

    index_meta = SearchIndex.query.filter_by(id=index_id, owner_id=user_id).first()
    if not index_meta:
        return jsonify({"error": "Index not found"}), 404
    if metric and metric != index_meta.metric:
        return jsonify({"error": f"Index metric is '{index_meta.metric}'. Please use the same metric for search."}), 400

    array, cell_names, _, cell_metadata = _load_dataset_array(index_meta.dataset_id)
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
        distances, indices, query_time_ms = _run_search(
            index_meta,
            query_vector,
            _search_limit(k, index_meta.n_cells, bool(filters), exclude_self=True),
        )
    except Exception:
        return jsonify({"error": "Search failed. Check index and query."}), 500

    results = []
    for dist, i in zip(distances, indices):
        if int(i) == idx:
            continue  # skip the query cell itself
        cell_info = _cell_info(cell_names, cell_metadata, i)
        if not _matches_filters(cell_info, filters):
            continue
        results.append({
            "rank": len(results) + 1,
            "cell_id": int(i),
            **cell_info,
            "distance": float(dist),
        })
        if len(results) >= k:
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
        "metric": index_meta.metric,
        "query_cell": cell_names[idx] if idx < len(cell_names) else str(idx),
        "filters": filters,
    })


@search_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    history_entries = (
        SearchHistory.query.filter_by(user_id=user_id)
        .order_by(SearchHistory.timestamp.desc())
        .limit(MAX_HISTORY)
        .all()
    )
    return jsonify([entry.to_dict() for entry in history_entries])


@search_bp.route("/history", methods=["DELETE"])
@jwt_required()
def delete_history():
    """Delete one or more history entries for the current user.
    Accepts JSON body: { "ids": [<id>, ...] } or { "all": true } to remove all entries for the user.
    """
    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    if body.get("all"):
        reason = str(body.get("reason") or "").strip()
        if not reason:
            return jsonify({"error": "A confirmation reason is required when clearing all history."}), 400
        SearchHistory.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        return jsonify({"deleted": "all", "reason": reason})

    ids = body.get("ids") or []
    if not isinstance(ids, list) or not ids:
        return jsonify({"error": "Provide non-empty 'ids' array or set 'all': true."}), 400

    # Only delete entries that belong to the current user
    SearchHistory.query.filter(SearchHistory.user_id == user_id, SearchHistory.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"deleted": len(ids)})
