import os
import re
import uuid
from datetime import datetime

import numpy as np
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from config import Config
from models import db
from models.metadata import Dataset, SearchHistory, SearchIndex
from services.data_service import (
    load_csv,
    load_h5,
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


def _save_numpy(array, cell_names, feature_names, dataset_id):
    np_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}.npy")
    meta_path = os.path.join(Config.UPLOAD_FOLDER, f"{dataset_id}_meta.json")
    np.save(np_path, array)
    with open(meta_path, "w") as f:
        import json
        json.dump({"cell_names": cell_names, "feature_names": feature_names}, f)
    return np_path


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
    return array, meta["cell_names"], meta["feature_names"]


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
        if ext in (".h5", ".h5ad"):
            array, cell_names, feature_names = load_h5(upload_path)
        else:
            array, cell_names, feature_names = load_csv(upload_path)

        validation = validate_data(array)
        if not validation["valid"]:
            os.remove(upload_path)
            return jsonify({"error": validation["message"]}), 422

        _save_numpy(array, cell_names, feature_names, dataset_id)
    except Exception:
        if os.path.exists(upload_path):
            os.remove(upload_path)
        return jsonify({"error": "Failed to parse file. Check format and content."}), 422

    dataset = Dataset.create(
        id=dataset_id,
        name=safe_name,
        owner_id=user_id,
        shape_rows=array.shape[0],
        shape_cols=array.shape[1],
        cell_count=array.shape[0],
        feature_count=array.shape[1],
        cell_names_preview=cell_names[:5],
        feature_names_preview=feature_names[:5],
        original_file=upload_path,
        status="ready",
        created_at=datetime.utcnow(),
    )
    db.session.add(dataset)
    db.session.commit()

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
    array, cell_names, feature_names = generate_random_data(1000, 50)

    dataset_id = str(uuid.uuid4())
    _save_numpy(array, cell_names, feature_names, dataset_id)

    dataset = Dataset.create(
        id=dataset_id,
        name="demo_data.csv",
        owner_id=user_id,
        shape_rows=array.shape[0],
        shape_cols=array.shape[1],
        cell_count=array.shape[0],
        feature_count=array.shape[1],
        cell_names_preview=cell_names[:5],
        feature_names_preview=feature_names[:5],
        original_file=None,
        status="ready",
        created_at=datetime.utcnow(),
    )
    db.session.add(dataset)
    db.session.commit()

    return jsonify({
        "dataset_id": dataset_id,
        "shape": list(array.shape),
        "cell_count": array.shape[0],
        "feature_count": array.shape[1],
        "message": "Demo dataset generated (1000 cells × 50 features)",
    }), 201


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
    if ds.original_file and os.path.exists(ds.original_file):
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

    array, cell_names, feature_names = _load_dataset_array(dataset_id)
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

    _save_numpy(array.astype(np.float32), cell_names, feature_names, dataset_id)
    ds.status = f"preprocessed ({label})"
    db.session.commit()
    return jsonify({"message": f"Dataset preprocessed: {label}", "shape": list(array.shape)})
