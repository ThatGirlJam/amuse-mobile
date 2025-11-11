"""
Flask application factory for facial analysis API
"""
from flask import Flask
from flask_cors import CORS


def create_app(config=None):
    """
    Create and configure the Flask application

    Args:
        config: Optional configuration dictionary

    Returns:
        Flask application instance
    """
    app = Flask(__name__)

    # Enable CORS for all routes (configure domains in production)
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:3001"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"]
        }
    })

    # Load configuration
    if config:
        app.config.update(config)

    # Register blueprints
    from app.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    return app
