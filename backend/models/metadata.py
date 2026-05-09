import json
from datetime import datetime

from models import db


def _json_dumps(value):
    return json.dumps(value or [], ensure_ascii=False)


def _json_loads(value):
    if not value:
        return []
    return json.loads(value)


class Dataset(db.Model):
    __tablename__ = "datasets"

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    owner_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    shape_rows = db.Column(db.Integer, nullable=False)
    shape_cols = db.Column(db.Integer, nullable=False)
    cell_count = db.Column(db.Integer, nullable=False)
    feature_count = db.Column(db.Integer, nullable=False)
    cell_names_preview = db.Column(db.Text, nullable=False, default="[]")
    feature_names_preview = db.Column(db.Text, nullable=False, default="[]")
    original_file = db.Column(db.String(500))
    status = db.Column(db.String(100), nullable=False, default="ready")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    indices = db.relationship("SearchIndex", back_populates="dataset", cascade="all, delete-orphan")

    def to_summary_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "shape": [self.shape_rows, self.shape_cols],
            "cell_count": self.cell_count,
            "feature_count": self.feature_count,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }

    def to_dict(self):
        return {
            **self.to_summary_dict(),
            "cell_names": _json_loads(self.cell_names_preview),
            "feature_names": _json_loads(self.feature_names_preview),
            "original_file": self.original_file,
        }

    @classmethod
    def create(cls, **kwargs):
        kwargs["cell_names_preview"] = _json_dumps(kwargs.pop("cell_names_preview", []))
        kwargs["feature_names_preview"] = _json_dumps(kwargs.pop("feature_names_preview", []))
        return cls(**kwargs)


class SearchIndex(db.Model):
    __tablename__ = "search_indices"

    id = db.Column(db.String(36), primary_key=True)
    dataset_id = db.Column(db.String(36), db.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    index_type = db.Column(db.String(32), nullable=False)
    metric = db.Column(db.String(16), nullable=False)
    n_trees = db.Column(db.Integer, nullable=False, default=10)
    n_cells = db.Column(db.Integer, nullable=False)
    n_features = db.Column(db.Integer, nullable=False)
    index_path = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(32), nullable=False, default="ready")
    build_time = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    dataset = db.relationship("Dataset", back_populates="indices")

    def to_summary_dict(self):
        return {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "index_type": self.index_type,
            "metric": self.metric,
            "n_cells": self.n_cells,
            "n_features": self.n_features,
            "status": self.status,
            "build_time": self.build_time,
            "created_at": self.created_at.isoformat(),
        }

    def to_dict(self):
        return {
            **self.to_summary_dict(),
            "owner": self.owner_id,
            "n_trees": self.n_trees,
            "index_path": self.index_path,
        }


class SearchHistory(db.Model):
    __tablename__ = "search_history"

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_type = db.Column("type", db.String(20), nullable=False)
    index_id = db.Column(db.String(36), nullable=False, index=True)
    cell_id = db.Column(db.String(100))
    k = db.Column(db.Integer, nullable=False)
    query_time_ms = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.entry_type,
            "index_id": self.index_id,
            "cell_id": self.cell_id,
            "k": self.k,
            "query_time_ms": self.query_time_ms,
            "timestamp": self.timestamp.isoformat(),
        }