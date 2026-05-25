import os
import uuid
import numpy as np
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config import Config
from models import db
from models.metadata import Dataset, SearchHistory, JointIndex, JointIndexDataset
from services.chroma_service import (
    create_collection,
    search_collection,
    delete_collection,
    CHROMA_AVAILABLE,
)

joint_bp = Blueprint("joint", __name__, url_prefix="/api/joint")

MAX_HISTORY = 10


def _load_dataset_array(dataset_id):
    np_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}.npy")
    meta_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}_meta.json")
    if not os.path.exists(np_path):
        return None, None, None
    import json
    array = np.load(np_path)
    with open(meta_path, "r") as f:
        meta = json.load(f)
    return array, meta["cell_names"], meta.get("cell_metadata", [])


def _add_to_history(user_id, entry):
    history_entry = SearchHistory(
        id=entry["id"],
        user_id=user_id,
        entry_type=entry["type"],
        index_id=entry.get("index_id"),
        joint_index_id=entry.get("joint_index_id"),
        cell_id=entry.get("cell_id"),
        k=entry["k"],
        query_time_ms=entry["query_time_ms"],
        query_text=entry.get("query_text"),
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


@joint_bp.route("/build", methods=["POST"])
@jwt_required()
def build_joint_index():
    if not CHROMA_AVAILABLE:
        return jsonify({"error": "ChromaDB is not installed"}), 503

    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    name = (body.get("name") or "").strip()
    dataset_ids = body.get("dataset_ids") or []
    metric = body.get("metric", "cosine")

    if not name:
        return jsonify({"error": "name is required"}), 400
    if not isinstance(dataset_ids, list) or len(dataset_ids) < 2:
        return jsonify({"error": "At least 2 dataset_ids are required"}), 400
    if metric not in ("cosine", "l2", "ip"):
        return jsonify({"error": "metric must be cosine, l2, or ip"}), 400

    # Validate ownership and feature dimension consistency
    datasets = Dataset.query.filter(
        Dataset.id.in_(dataset_ids), Dataset.owner_id == user_id
    ).all()
    if len(datasets) != len(set(dataset_ids)):
        return jsonify({"error": "Some datasets not found or not owned by you"}), 404

    n_features = None
    for ds in datasets:
        if n_features is None:
            n_features = ds.feature_count
        elif ds.feature_count != n_features:
            return jsonify({
                "error": f"Dataset '{ds.name}' has {ds.feature_count} features, expected {n_features}"
            }), 400

    # Load all vectors and build metadata
    all_vectors = []
    all_metadatas = []
    all_ids = []
    total_cells = 0
    joint_datasets = []

    for ds in datasets:
        array, cell_names, cell_metadata = _load_dataset_array(ds.id)
        if array is None:
            return jsonify({"error": f"Data for dataset '{ds.name}' not found on disk"}), 404

        n_cells = array.shape[0]
        total_cells += n_cells
        joint_datasets.append({
            "dataset_id": ds.id,
            "cell_count": n_cells,
        })

        for i in range(n_cells):
            vector = array[i].tolist()
            meta = {
                "cell_name": str(cell_names[i]) if i < len(cell_names) else f"cell_{i}",
                "dataset_source": ds.name,
                "dataset_id": ds.id,
            }
            if i < len(cell_metadata) and isinstance(cell_metadata[i], dict):
                cm = cell_metadata[i]
                for field in ("cell_type", "disease", "AgeGroup", "donor_id"):
                    if cm.get(field):
                        meta[field] = str(cm[field])
            all_metadatas.append(meta)
            all_ids.append(f"{ds.id}_{i}")
            all_vectors.append(vector)

    joint_id = str(uuid.uuid4())
    collection_name = f"joint_{joint_id}"

    try:
        build_time = create_collection(
            collection_name=collection_name,
            vectors=all_vectors,
            metadatas=all_metadatas,
            ids=all_ids,
            metric=metric,
        )
    except Exception as e:
        return jsonify({"error": f"Failed to build ChromaDB index: {str(e)}"}), 500

    joint_index = JointIndex.create(
        id=joint_id,
        name=name,
        owner_id=user_id,
        index_type="chroma_hnsw",
        metric=metric,
        n_cells=total_cells,
        n_features=n_features,
        collection_name=collection_name,
        status="ready",
        build_time=build_time,
    )
    db.session.add(joint_index)

    for jd in joint_datasets:
        link = JointIndexDataset(
            id=str(uuid.uuid4()),
            joint_index_id=joint_id,
            dataset_id=jd["dataset_id"],
            cell_count=jd["cell_count"],
        )
        db.session.add(link)

    db.session.commit()

    return jsonify(joint_index.to_dict()), 201


@joint_bp.route("/list", methods=["GET"])
@jwt_required()
def list_joint_indices():
    user_id = get_jwt_identity()
    indices = (
        JointIndex.query.filter_by(owner_id=user_id)
        .order_by(JointIndex.created_at.desc())
        .all()
    )
    return jsonify([idx.to_summary_dict() for idx in indices])


@joint_bp.route("/<joint_id>", methods=["GET"])
@jwt_required()
def get_joint_index(joint_id):
    user_id = get_jwt_identity()
    idx = JointIndex.query.filter_by(id=joint_id, owner_id=user_id).first()
    if not idx:
        return jsonify({"error": "Joint index not found"}), 404
    return jsonify(idx.to_dict())


@joint_bp.route("/<joint_id>", methods=["DELETE"])
@jwt_required()
def delete_joint_index(joint_id):
    user_id = get_jwt_identity()
    idx = JointIndex.query.filter_by(id=joint_id, owner_id=user_id).first()
    if not idx:
        return jsonify({"error": "Joint index not found"}), 404

    # Delete related search history
    SearchHistory.query.filter_by(joint_index_id=joint_id).delete()

    # Delete ChromaDB collection
    delete_collection(idx.collection_name)

    # Delete DB record (cascades to JointIndexDataset)
    db.session.delete(idx)
    db.session.commit()

    return jsonify({"message": "Joint index deleted"})


@joint_bp.route("/query", methods=["POST"])
@jwt_required()
def query_joint_index():
    if not CHROMA_AVAILABLE:
        return jsonify({"error": "ChromaDB is not installed"}), 503

    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    joint_index_id = body.get("joint_index_id")
    query_vector = body.get("query_vector")
    k = int(body.get("k", 10))
    filters = _extract_filters(body)

    if not joint_index_id:
        return jsonify({"error": "joint_index_id is required"}), 400
    if query_vector is None:
        return jsonify({"error": "query_vector is required"}), 400
    if k < 1 or k > 1000:
        return jsonify({"error": "k must be between 1 and 1000"}), 400

    idx = JointIndex.query.filter_by(id=joint_index_id, owner_id=user_id).first()
    if not idx:
        return jsonify({"error": "Joint index not found"}), 404

    try:
        results, query_time_ms = search_collection(
            collection_name=idx.collection_name,
            query_vector=query_vector,
            k=k,
            filters=filters,
        )
    except Exception:
        return jsonify({"error": "Search failed. Check the joint index and query vector."}), 500

    _add_to_history(user_id, {
        "id": str(uuid.uuid4()),
        "type": "vector",
        "joint_index_id": joint_index_id,
        "k": k,
        "query_time_ms": query_time_ms,
    })

    return jsonify({
        "results": results,
        "query_time_ms": query_time_ms,
        "k": k,
        "metric": idx.metric,
        "filters": filters,
    })


@joint_bp.route("/<joint_id>/datasets", methods=["GET"])
@jwt_required()
def list_joint_datasets(joint_id):
    user_id = get_jwt_identity()
    idx = JointIndex.query.filter_by(id=joint_id, owner_id=user_id).first()
    if not idx:
        return jsonify({"error": "Joint index not found"}), 404

    result = []
    for jd in idx.datasets:
        ds = Dataset.query.get(jd.dataset_id)
        result.append({
            "dataset_id": jd.dataset_id,
            "name": ds.name if ds else "(deleted)",
            "cell_count": jd.cell_count,
        })
    return jsonify(result)


def _extract_filters(payload):
    FILTER_FIELDS = ("cell_type", "disease", "AgeGroup", "donor_id")
    raw = payload.get("filters") or {}
    if not isinstance(raw, dict):
        return {}
    filters = {}
    for field in FILTER_FIELDS:
        value = raw.get(field)
        if value is None:
            continue
        value = str(value).strip()
        if value:
            filters[field] = value
    return filters
