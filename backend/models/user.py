import json
import os
import uuid
from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash


class User:
    def __init__(self, id, username, email, password_hash, created_at=None):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.created_at = created_at or datetime.utcnow().isoformat()

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "password_hash": self.password_hash,
            "created_at": self.created_at,
        }

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data["id"],
            username=data["username"],
            email=data["email"],
            password_hash=data["password_hash"],
            created_at=data.get("created_at"),
        )


class UserStore:
    def __init__(self, db_path):
        self.db_path = db_path
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.db_path):
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            self._write([])

    def _read(self):
        try:
            with open(self.db_path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _write(self, users):
        with open(self.db_path, "w") as f:
            json.dump(users, f, indent=2)

    def create_user(self, username, email, password):
        users = self._read()
        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password)
        user = User(id=user_id, username=username, email=email, password_hash=password_hash)
        users.append(user.to_dict())
        self._write(users)
        return user

    def get_user_by_username(self, username):
        users = self._read()
        for u in users:
            if u["username"] == username:
                return User.from_dict(u)
        return None

    def get_user_by_id(self, user_id):
        users = self._read()
        for u in users:
            if u["id"] == user_id:
                return User.from_dict(u)
        return None

    def username_exists(self, username):
        return self.get_user_by_username(username) is not None
