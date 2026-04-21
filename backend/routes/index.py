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
    build_faiss_index,
    build_annoy_index,
    save_faiss_index,
    save_annoy_index,
)

index_bp = Blueprint("index", __name__, url_prefix="/api/index")

ALLOWED_INDEX_TYPES = {"faiss_flat", "faiss_ivf", "annoy"}
ALLOWED_METRICS = {"l2", "cosine", "ip"}


def _read_db():
    if not os.path.exists(Config.INDEX_DB_PATH):
        return {}
    try:
        with open(Config.INDEX_DB_PATH, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def _write_db(data):
    os.makedirs(os.path.dirname(Config.INDEX_DB_PATH), exist_ok=True)
    with open(Config.INDEX_DB_PATH, "w") as f:
        json.dump(data, f, indent=2)


def _load_dataset_array(dataset_id):
    np_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}.npy")
    meta_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}_meta.json")
    if not os.path.exists(np_path):
        return None, None, None
    array = np.load(np_path)
    with open(meta_path, "r") as f:
        meta = json.load(f)
    return array, meta["cell_names"], meta["feature_names"]


def _read_data_db():
    data_db_path = Config.DATA_DB_PATH
    if not os.path.exists(data_db_path):
        return {}
    try:
        with open(data_db_path, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


@index_bp.route("/build", methods=["POST"])
@jwt_required()
def build_index():
    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    dataset_id = body.get("dataset_id")
    index_type = body.get("index_type", "faiss_flat")
    metric = body.get("metric", "l2")
    n_trees = int(body.get("n_trees", 10))

    if not dataset_id:
        return jsonify({"error": "dataset_id is required"}), 400
    if index_type not in ALLOWED_INDEX_TYPES:
        return jsonify({"error": f"index_type must be one of {ALLOWED_INDEX_TYPES}"}), 400
    if metric not in ALLOWED_METRICS:
        return jsonify({"error": f"metric must be one of {ALLOWED_METRICS}"}), 400

    data_db = _read_data_db()
    ds = data_db.get(dataset_id)
    if not ds:
        return jsonify({"error": "Dataset not found"}), 404
    if ds["owner"] != user_id:
        return jsonify({"error": "Forbidden"}), 403

    array, cell_names, feature_names = _load_dataset_array(dataset_id)
    if array is None:
        return jsonify({"error": "Dataset data not found on disk"}), 404

    index_id = str(uuid.uuid4())
    index_path = os.path.join(Config.INDEX_FOLDER, index_id)

    try:
        start = time.time()
        if index_type == "annoy":
            idx = build_annoy_index(array, metric=metric, n_trees=n_trees)
            save_annoy_index(idx, index_path + ".ann")
            stored_path = index_path + ".ann"
        else:
            idx = build_faiss_index(array, index_type=index_type, metric=metric)
            save_faiss_index(idx, index_path + ".faiss")
            stored_path = index_path + ".faiss"
        build_time = round(time.time() - start, 3)
    except Exception as e:
        return jsonify({"error": f"Failed to build index: {str(e)}"}), 500

    db = _read_db()
    db[index_id] = {
        "id": index_id,
        "dataset_id": dataset_id,
        "owner": user_id,
        "index_type": index_type,
        "metric": metric,
        "n_trees": n_trees,
        "n_cells": array.shape[0],
        "n_features": array.shape[1],
        "index_path": stored_path,
        "status": "ready",
        "build_time": build_time,
        "created_at": datetime.utcnow().isoformat(),
    }
    _write_db(db)

    return jsonify({
        "index_id": index_id,
        "dataset_id": dataset_id,
        "index_type": index_type,
        "metric": metric,
        "status": "ready",
        "build_time": build_time,
    }), 201


@index_bp.route("/list", methods=["GET"])
@jwt_required()
def list_indices():
    user_id = get_jwt_identity()
    db = _read_db()
    indices = [
        {
            "id": v["id"],
            "dataset_id": v["dataset_id"],
            "index_type": v["index_type"],
            "metric": v["metric"],
            "n_cells": v["n_cells"],
            "n_features": v["n_features"],
            "status": v["status"],
            "build_time": v["build_time"],
            "created_at": v["created_at"],
        }
        for v in db.values()
        if v.get("owner") == user_id
    ]
    return jsonify(indices)


@index_bp.route("/<index_id>", methods=["GET"])
@jwt_required()
def get_index(index_id):
    user_id = get_jwt_identity()
    db = _read_db()
    idx = db.get(index_id)
    if not idx:
        return jsonify({"error": "Index not found"}), 404
    if idx["owner"] != user_id:
        return jsonify({"error": "Forbidden"}), 403
    return jsonify(idx)


@index_bp.route("/<index_id>", methods=["DELETE"])
@jwt_required()
def delete_index(index_id):
    user_id = get_jwt_identity()
    db = _read_db()
    idx = db.get(index_id)
    if not idx:
        return jsonify({"error": "Index not found"}), 404
    if idx["owner"] != user_id:
        return jsonify({"error": "Forbidden"}), 403

    index_path = idx.get("index_path")
    if index_path and os.path.exists(index_path):
        os.remove(index_path)

    del db[index_id]
    _write_db(db)
    return jsonify({"message": "Index deleted"})
