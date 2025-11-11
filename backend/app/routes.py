"""
API routes for facial analysis service
"""

from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
import os
from datetime import datetime

from app.utils.face_analyzer import FaceAnalyzer

# Create blueprint
api_bp = Blueprint("api", __name__)


@api_bp.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint to verify API is running

    Returns:
        JSON response with status and timestamp
    """
    return (
        jsonify(
            {
                "status": "healthy",
                "service": "facial-analysis-api",
                "timestamp": datetime.utcnow().isoformat(),
                "version": "1.0.0",
            }
        ),
        200,
    )


@api_bp.route("/analyze", methods=["POST"])
def analyze_face():
    """
    Analyze facial features from uploaded image

    Expects:
        Multipart form data with 'image' file

    Returns:
        JSON response with face landmarks and basic analysis
    """
    try:
        # Check if image was uploaded
        if "image" not in request.files:
            return (
                jsonify(
                    {
                        "error": "No image file provided",
                        "message": 'Please upload an image file with key "image"',
                    }
                ),
                400,
            )

        file = request.files["image"]

        # Check if file has a filename
        if file.filename == "":
            return (
                jsonify(
                    {
                        "error": "Empty filename",
                        "message": "Please select a valid image file",
                    }
                ),
                400,
            )

        # Validate file extension
        allowed_extensions = {"png", "jpg", "jpeg", "webp"}
        file_ext = (
            file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else ""
        )

        if file_ext not in allowed_extensions:
            return (
                jsonify(
                    {
                        "error": "Invalid file type",
                        "message": f'Allowed types: {", ".join(allowed_extensions)}',
                    }
                ),
                400,
            )

        # Initialize face analyzer
        analyzer = FaceAnalyzer()

        # Read image file
        image_bytes = file.read()

        # Analyze face
        result = analyzer.analyze_image(image_bytes)

        if result.get("error"):
            return jsonify(result), 400

        return (
            jsonify(
                {
                    "success": True,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": result,
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
