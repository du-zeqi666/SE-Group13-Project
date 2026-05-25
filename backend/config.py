import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = 24

    DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
    DB_PORT = int(os.environ.get("DB_PORT", "3306"))
    DB_NAME = os.environ.get("DB_NAME", "ann_search")
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or (
        f"mysql+pymysql://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME")
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

    STORAGE_PATH = os.path.join(os.path.dirname(__file__), "storage")
    UPLOAD_FOLDER = os.path.join(STORAGE_PATH, "uploads")
    INDEX_FOLDER = os.path.join(STORAGE_PATH, "indices")
    CHROMA_PATH = os.path.abspath(os.path.join(STORAGE_PATH, "chromadb"))
    DATA_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH_MB", "100")) * 1024 * 1024

    RAG_EMBEDDING_MODEL = os.environ.get("RAG_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    RAG_LLM_ENABLED = os.environ.get("RAG_LLM_ENABLED", "false").lower() == "true"
    RAG_LLM_API_URL = os.environ.get("RAG_LLM_API_URL", "")
    RAG_LLM_API_KEY = os.environ.get("RAG_LLM_API_KEY", "")
    RAG_LLM_MODEL = os.environ.get("RAG_LLM_MODEL", "gpt-4o-mini")
