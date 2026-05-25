from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from models.user import User  # noqa: E402,F401
from models.metadata import Dataset, SearchHistory, SearchIndex, JointIndex, JointIndexDataset  # noqa: E402,F401