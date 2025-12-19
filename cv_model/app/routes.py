"""
API routes for facial analysis service
"""

from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
import os
from datetime import datetime

from app.utils.face_analyzer import FaceAnalyzer
from app.services.analysis_service import AnalysisService

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

        # Check if results should be saved to database
        save_to_db = request.form.get('save', 'true').lower() == 'true'

        # Generate analysis ID for tracking
        import uuid
        analysis_id = str(uuid.uuid4())

        # Analyze face with bounding box upload enabled
        result = analyzer.analyze_image(
            image_bytes,
            upload_annotated=True,  # Enable Supabase upload for bounding boxes
            analysis_id=analysis_id
        )

        if result.get("error"):
            return jsonify(result), 400

        saved_id = None
        if save_to_db:
            try:
                saved_result = AnalysisService.save_analysis(result)
                saved_id = saved_result.id
            except Exception as e:
                # Log error but don't fail the request
                print(f"Warning: Failed to save to database: {str(e)}")

        # Clean up binary data from response (too large for JSON)
        if 'annotated_image_bytes' in result:
            del result['annotated_image_bytes']

        return (
            jsonify(
                {
                    "success": True,
                    "timestamp": datetime.utcnow().isoformat(),
                    "saved_id": saved_id,
                    "analysis_id": analysis_id,
                    "annotated_image_url": result.get("annotated_image_url"),  # URL for bounding box image
                    "data": result,
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@api_bp.route("/results/<int:result_id>", methods=["GET"])
def get_result(result_id):
    """
    Retrieve a specific analysis result by ID

    Args:
        result_id: Database ID of the analysis result

    Returns:
        JSON response with analysis result
    """
    try:
        result = AnalysisService.get_analysis_by_id(result_id)

        if not result:
            return jsonify({
                "error": "Not found",
                "message": f"Analysis result with ID {result_id} not found"
            }), 404

        return jsonify({
            "success": True,
            "data": result.to_dict()
        }), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@api_bp.route("/results", methods=["GET"])
def get_results():
    """
    Get recent analysis results or search by features

    Query parameters:
        limit: Maximum number of results (default: 10)
        eye_shape: Filter by eye shape
        nose_width: Filter by nose width
        lip_fullness: Filter by lip fullness

    Returns:
        JSON response with list of analysis results
    """
    try:
        limit = int(request.args.get('limit', 10))
        eye_shape = request.args.get('eye_shape')
        nose_width = request.args.get('nose_width')
        lip_fullness = request.args.get('lip_fullness')

        # If any filters provided, use search
        if eye_shape or nose_width or lip_fullness:
            results = AnalysisService.get_analyses_by_features(
                eye_shape=eye_shape,
                nose_width=nose_width,
                lip_fullness=lip_fullness,
                limit=limit
            )
        else:
            # Otherwise get recent results
            results = AnalysisService.get_recent_analyses(limit=limit)

        return jsonify({
            "success": True,
            "count": len(results),
            "data": [result.to_dict() for result in results]
        }), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@api_bp.route("/results/<int:result_id>", methods=["DELETE"])
def delete_result(result_id):
    """
    Delete a specific analysis result

    Args:
        result_id: Database ID of the analysis result

    Returns:
        JSON response confirming deletion
    """
    try:
        success = AnalysisService.delete_analysis(result_id)

        if not success:
            return jsonify({
                "error": "Not found",
                "message": f"Analysis result with ID {result_id} not found"
            }), 404

        return jsonify({
            "success": True,
            "message": f"Analysis result {result_id} deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": "Internal server error", "message": str(e)}), 500
