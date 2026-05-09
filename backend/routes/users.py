import os

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from config import Config
from models import db
from models.metadata import SearchHistory
from models.user import User

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


def _get_current_user():
    user_id = get_jwt_identity()
    return db.session.get(User, user_id)


def _require_admin():
    user = _get_current_user()
    if not user:
        return None, (jsonify({"error": "User not found"}), 404)
    if user.role != "admin":
        return None, (jsonify({"error": "Admin privileges required"}), 403)
    return user, None


def _validate_username_email(username, email, current_user_id=None):
    username = (username or "").strip()
    email = (email or "").strip()

    if not username or not email:
        return None, None, (jsonify({"error": "username and email are required"}), 400)

    username_owner = User.query.filter_by(username=username).first()
    if username_owner and username_owner.id != current_user_id:
        return None, None, (jsonify({"error": "Username already taken"}), 409)

    email_owner = User.query.filter_by(email=email).first()
    if email_owner and email_owner.id != current_user_id:
        return None, None, (jsonify({"error": "Email already registered"}), 409)

    return username, email, None


def _cleanup_user_storage(user):
    index_ids = [index.id for index in user.indices]
    for index in user.indices:
        if index.index_path and os.path.exists(index.index_path):
            os.remove(index.index_path)

    for dataset in user.datasets:
        safe_id = os.path.basename(dataset.id)
        for suffix in [".npy", "_meta.json"]:
            path = os.path.join(Config.UPLOAD_FOLDER, f"{safe_id}{suffix}")
            if os.path.exists(path):
                os.remove(path)
        if dataset.original_file and os.path.exists(dataset.original_file):
            os.remove(dataset.original_file)

    if index_ids:
        SearchHistory.query.filter(SearchHistory.index_id.in_(index_ids)).delete(synchronize_session=False)


@users_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_my_profile():
    user = _get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    username, email, error = _validate_username_email(data.get("username"), data.get("email"), user.id)
    if error:
        return error

    user.username = username
    user.email = email
    db.session.commit()
    return jsonify({"message": "Profile updated successfully", "user": user.to_public_dict()})


@users_bp.route("/me/password", methods=["PATCH"])
@jwt_required()
def update_my_password():
    user = _get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not current_password or not new_password:
        return jsonify({"error": "current_password and new_password are required"}), 400
    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password updated successfully"})


@users_bp.route("", methods=["GET"])
@jwt_required()
def list_users():
    _, error = _require_admin()
    if error:
        return error

    users = User.query.filter_by(role="user").order_by(User.created_at.desc()).all()
    return jsonify([
        {
            **user.to_public_dict(),
            "created_at": user.created_at.isoformat(),
        }
        for user in users
    ])


@users_bp.route("", methods=["POST"])
@jwt_required()
def create_user():
    _, error = _require_admin()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    username, email, validation_error = _validate_username_email(data.get("username"), data.get("email"))
    if validation_error:
        return validation_error

    password = data.get("password") or ""
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user = User.create(username=username, email=email, password=password, role="user")
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created successfully", "user": user.to_public_dict()}), 201


@users_bp.route("/<user_id>", methods=["PATCH"])
@jwt_required()
def update_user(user_id):
    _, error = _require_admin()
    if error:
        return error

    user = User.query.filter_by(id=user_id, role="user").first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    username, email, validation_error = _validate_username_email(data.get("username"), data.get("email"), user.id)
    if validation_error:
        return validation_error

    user.username = username
    user.email = email
    db.session.commit()
    return jsonify({"message": "User updated successfully", "user": user.to_public_dict()})


@users_bp.route("/<user_id>/password", methods=["PATCH"])
@jwt_required()
def reset_user_password(user_id):
    _, error = _require_admin()
    if error:
        return error

    user = User.query.filter_by(id=user_id, role="user").first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    new_password = data.get("new_password") or ""
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "User password updated successfully"})


@users_bp.route("/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    _, error = _require_admin()
    if error:
        return error

    user = User.query.filter_by(id=user_id, role="user").first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    _cleanup_user_storage(user)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"})