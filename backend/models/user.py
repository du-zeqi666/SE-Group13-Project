import uuid
from datetime import datetime

from sqlalchemy import or_
from werkzeug.security import check_password_hash, generate_password_hash

from models import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    datasets = db.relationship("Dataset", backref="owner", cascade="all, delete-orphan")
    indices = db.relationship("SearchIndex", backref="owner", cascade="all, delete-orphan")
    history_entries = db.relationship("SearchHistory", backref="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "password_hash": self.password_hash,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }

    def to_public_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
        }

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @classmethod
    def create(cls, username, email, password, role="user"):
        return cls(
            id=str(uuid.uuid4()),
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            role=role,
        )


def ensure_admin_user(config):
    if not all([config.ADMIN_USERNAME, config.ADMIN_EMAIL, config.ADMIN_PASSWORD]):
        return

    existing_admin = User.query.filter(
        or_(User.role == "admin", User.username == config.ADMIN_USERNAME, User.email == config.ADMIN_EMAIL)
    ).first()
    if existing_admin:
        return

    admin = User.create(
        username=config.ADMIN_USERNAME,
        email=config.ADMIN_EMAIL,
        password=config.ADMIN_PASSWORD,
        role="admin",
    )
    db.session.add(admin)
    db.session.commit()
