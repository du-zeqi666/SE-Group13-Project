import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = 24

    STORAGE_PATH = os.path.join(os.path.dirname(__file__), "storage")
    UPLOAD_FOLDER = os.path.join(STORAGE_PATH, "uploads")
    INDEX_FOLDER = os.path.join(STORAGE_PATH, "indices")
    USER_DB_PATH = os.path.join(STORAGE_PATH, "users.json")
    DATA_DB_PATH = os.path.join(STORAGE_PATH, "datasets.json")
    SEARCH_HISTORY_PATH = os.path.join(STORAGE_PATH, "search_history.json")
    INDEX_DB_PATH = os.path.join(STORAGE_PATH, "indices.json")

    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB
