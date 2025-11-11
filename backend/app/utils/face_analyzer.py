"""
Face analysis using MediaPipe Face Landmarker

This module handles face detection and landmark extraction using Google's MediaPipe.
Stage 1: Basic landmark detection
Stages 2-4: Will add feature classification logic
"""

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import cv2
from pathlib import Path


class FaceAnalyzer:
    """
    Facial analysis using MediaPipe Face Landmarker
    """

    def __init__(self, model_path=None):
        """
        Initialize the Face Analyzer

        Args:
            model_path: Path to MediaPipe face landmarker model file
                       If None, uses default location in models directory
        """
        if model_path is None:
            # Default model path - will be downloaded separately
            models_dir = Path(__file__).parent.parent.parent / "models"
            models_dir.mkdir(exist_ok=True)
            model_path = str(models_dir / "face_landmarker.task")

        self.model_path = model_path
        self.landmarker = None
        self._initialize_landmarker()

    def _initialize_landmarker(self):
        """
        Initialize MediaPipe Face Landmarker with configuration
        """
        try:
            # Configure landmarker options
            base_options = python.BaseOptions(model_asset_path=self.model_path)
            options = vision.FaceLandmarkerOptions(
                base_options=base_options,
                running_mode=vision.RunningMode.IMAGE,
                num_faces=1,  # Focus on single face for cleaner results
                min_face_detection_confidence=0.5,
                min_face_presence_confidence=0.5,
                min_tracking_confidence=0.5,
                output_face_blendshapes=False,  # Not needed for feature analysis
                output_facial_transformation_matrixes=False,
            )

            # Create landmarker
            self.landmarker = vision.FaceLandmarker.create_from_options(options)

        except Exception as e:
            raise RuntimeError(f"Failed to initialize Face Landmarker: {str(e)}")

    def analyze_image(self, image_bytes):
        """
        Analyze facial features from image bytes

        Args:
            image_bytes: Raw image data as bytes

        Returns:
            Dictionary containing:
                - face_detected: Boolean
                - num_faces: Number of faces detected
                - landmarks: List of landmark coordinates (if face detected)
                - error: Error message (if any)
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                return {"error": "Failed to decode image", "face_detected": False}

            # Convert BGR to RGB (MediaPipe expects RGB)
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Create MediaPipe Image object
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

            # Detect face landmarks
            detection_result = self.landmarker.detect(mp_image)

            # Check if face was detected
            if not detection_result.face_landmarks:
                return {
                    "error": "No face detected in image",
                    "face_detected": False,
                    "num_faces": 0,
                    "message": "Please ensure the image contains a clear, front-facing face",
                }

            # Check for multiple faces
            num_faces = len(detection_result.face_landmarks)
            if num_faces > 1:
                return {
                    "error": "Multiple faces detected",
                    "face_detected": True,
                    "num_faces": num_faces,
                    "message": "Please upload an image with only one face",
                }

            # Extract landmarks for the detected face
            face_landmarks = detection_result.face_landmarks[0]

            # Convert landmarks to serializable format
            landmarks_list = []
            for landmark in face_landmarks:
                landmarks_list.append(
                    {"x": landmark.x, "y": landmark.y, "z": landmark.z}
                )

            return {
                "face_detected": True,
                "num_faces": 1,
                "num_landmarks": len(landmarks_list),
                "landmarks": landmarks_list,
                "image_dimensions": {"width": image.shape[1], "height": image.shape[0]},
            }

        except Exception as e:
            return {
                "error": "Analysis failed",
                "face_detected": False,
                "message": str(e),
            }

    def __del__(self):
        """Cleanup landmarker on deletion"""
        if self.landmarker:
            self.landmarker.close()
