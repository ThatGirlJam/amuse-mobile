"""
Face analysis using MediaPipe Face Landmarker

This module handles face detection and landmark extraction using Google's MediaPipe.
Stage 1: Basic landmark detection
Stage 2: Eye shape classification
Stage 3: Nose width classification
Stage 4: Lip fullness classification
"""

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import cv2
from pathlib import Path

from app.utils.eye_classifier import EyeClassifier
from app.utils.nose_classifier import NoseClassifier
from app.utils.lip_classifier import LipClassifier
from app.utils.summary_formatter import SummaryFormatter
from app.utils.quality_validator import QualityValidator
from app.utils.bounding_box_calculator import BoundingBoxCalculator
from app.utils.image_annotator import ImageAnnotator
from app.utils.storage_client import StorageClient


class FaceAnalyzer:
    """
    Facial analysis using MediaPipe Face Landmarker with feature classification
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

        # Initialize feature classifiers
        self.eye_classifier = EyeClassifier()
        self.nose_classifier = NoseClassifier()
        self.lip_classifier = LipClassifier()

        # Initialize summary formatter
        self.summary_formatter = SummaryFormatter()

        # Initialize NEW components
        self.quality_validator = QualityValidator()
        self.bbox_calculator = BoundingBoxCalculator(padding_percent=0.15)
        self.image_annotator = ImageAnnotator()
        self.storage_client = StorageClient()

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

    def analyze_image(self, image_bytes, upload_annotated: bool = False, analysis_id: str = None):
        """
        Analyze facial features from image bytes

        Args:
            image_bytes: Raw image data as bytes
            upload_annotated: If True, upload annotated image to Supabase Storage
            analysis_id: Optional analysis ID for associating uploaded image

        Returns:
            Dictionary containing:
                - face_detected: Boolean
                - num_faces: Number of faces detected
                - landmarks: List of landmark coordinates (if face detected)
                - annotated_image_url: URL of uploaded annotated image (if upload_annotated=True)
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

            image_width = image.shape[1]
            image_height = image.shape[0]

            # NEW: Quality validation
            quality_result = self.quality_validator.validate_all(
                landmarks_list,
                image_width,
                image_height
            )

            # Classify eye shape (Stage 2)
            eye_classification = self.eye_classifier.classify_eyes(landmarks_list)

            # Classify nose width (Stage 3)
            nose_classification = self.nose_classifier.classify_nose(landmarks_list)

            # Classify lip fullness (Stage 4)
            lip_classification = self.lip_classifier.classify_lips(landmarks_list)

            # NEW: Calculate bounding boxes
            bounding_boxes = self.bbox_calculator.calculate_all_boxes(
                landmarks_list,
                image_width,
                image_height,
                normalize=True
            )

            # Create unified summary (Stage 5)
            summary = self.summary_formatter.create_summary(
                eye_classification,
                nose_classification,
                lip_classification
            )

            # NEW: Create annotated image
            annotated_image_bytes = None
            annotated_image_url = None

            try:
                # Create classification dict for labels
                classifications = {
                    'eye_shape': eye_classification.get('eye_shape', ''),
                    'nose_width': nose_classification.get('nose_width', ''),
                    'lip_fullness': lip_classification.get('lip_fullness', ''),
                }

                annotated_image_bytes = self.image_annotator.annotate_image(
                    image_bytes,
                    bounding_boxes,
                    classifications,
                    show_labels=True,
                    show_confidence=True
                )

                # Upload to Supabase if requested
                if upload_annotated and annotated_image_bytes:
                    upload_result = self.storage_client.upload_annotated_image(
                        annotated_image_bytes,
                        analysis_id=analysis_id,
                        file_extension="png"
                    )
                    if upload_result and upload_result.get('success'):
                        annotated_image_url = upload_result.get('public_url')
                        print(f"Annotated image uploaded: {annotated_image_url}")

            except Exception as e:
                print(f"Warning: Failed to create/upload annotated image: {e}")

            result = {
                "face_detected": True,
                "num_faces": 1,
                "num_landmarks": len(landmarks_list),
                "landmarks": landmarks_list,
                "image_dimensions": {"width": image_width, "height": image_height},
                "quality_check": quality_result,
                "bounding_boxes": bounding_boxes,
                "eye_analysis": eye_classification,
                "nose_analysis": nose_classification,
                "lip_analysis": lip_classification,
                "summary": summary,
                "annotated_image_bytes": annotated_image_bytes  # For internal use
            }

            # Add annotated image URL if it was uploaded
            if annotated_image_url:
                result["annotated_image_url"] = annotated_image_url

            return result

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
