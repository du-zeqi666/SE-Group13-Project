from datetime import timedelta

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db
from models.user import ensure_admin_user
from routes.auth import auth_bp
from routes.data import data_bp
from routes.index import index_bp
from routes.search import search_bp
from routes.users import users_bp
import os


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=Config.JWT_ACCESS_TOKEN_EXPIRES_HOURS)

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})
    JWTManager(app)

    # Ensure storage directories exist
    for path in [
        Config.STORAGE_PATH,
        Config.UPLOAD_FOLDER,
        Config.INDEX_FOLDER,
    ]:
        os.makedirs(path, exist_ok=True)

    with app.app_context():
        db.create_all()
        ensure_admin_user(Config)

    app.register_blueprint(auth_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(index_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(users_bp)

    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "ANN Search API is running"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=False, host="0.0.0.0", port=5000)
