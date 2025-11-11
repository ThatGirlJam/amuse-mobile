"""
Eye Shape Classification Module

Uses MediaPipe face landmark indices to classify eye shapes into six categories:
- Almond: Balanced proportions with slight taper at corners
- Round: Height-to-width ratio closer to 1, more circular appearance
- Monolid: No visible crease, minimal upper eyelid visibility
- Hooded: Excess skin covering crease, low upper eyelid visibility
- Upturned: Outer corner higher than inner corner
- Downturned: Outer corner lower than inner corner

MediaPipe Face Mesh Landmark Indices (478 total landmarks):
- Right eye outline: 33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246
- Left eye outline: 263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466
- Right eye iris: 468, 469, 470, 471, 472
- Left eye iris: 473, 474, 475, 476, 477
"""

import numpy as np
from typing import List, Dict, Tuple


class EyeClassifier:
    """
    Classifies eye shape based on geometric analysis of facial landmarks
    """

    # MediaPipe landmark indices for eye analysis
    RIGHT_EYE_LANDMARKS = {
        "outline": [
            33,
            7,
            163,
            144,
            145,
            153,
            154,
            155,
            133,
            173,
            157,
            158,
            159,
            160,
            161,
            246,
        ],
        "upper_lid": [159, 160, 161, 246, 33, 7, 163],  # Top contour
        "lower_lid": [144, 145, 153, 154, 155, 133],  # Bottom contour
        "inner_corner": 133,
        "outer_corner": 33,
        "top_center": 159,
        "bottom_center": 145,
        "iris_center": 468,
    }

    LEFT_EYE_LANDMARKS = {
        "outline": [
            263,
            249,
            390,
            373,
            374,
            380,
            381,
            382,
            362,
            398,
            384,
            385,
            386,
            387,
            388,
            466,
        ],
        "upper_lid": [386, 387, 388, 466, 263, 249, 390],  # Top contour
        "lower_lid": [373, 374, 380, 381, 382, 362],  # Bottom contour
        "inner_corner": 362,
        "outer_corner": 263,
        "top_center": 386,
        "bottom_center": 374,
        "iris_center": 473,
    }

    # Classification thresholds (tuned based on typical face proportions)
    THRESHOLDS = {
        "aspect_ratio": {
            "round_min": 0.55,  # Height/width > 0.55 indicates rounder eye
            "almond_min": 0.35,
            "almond_max": 0.55,
        },
        "eyelid_coverage": {
            "monolid_max": 0.15,  # Very low upper eyelid visibility
            "hooded_max": 0.35,  # Low to moderate upper eyelid visibility
        },
        "corner_angle": {
            "upturned_min": 3.0,  # Degrees above horizontal
            "downturned_max": -3.0,  # Degrees below horizontal
        },
    }

    def __init__(self):
        """Initialize the eye classifier"""
        pass

    def classify_eyes(self, landmarks: List[Dict]) -> Dict:
        """
        Classify eye shape from facial landmarks

        Args:
            landmarks: List of landmark dictionaries with 'x', 'y', 'z' coordinates

        Returns:
            Dictionary with eye shape classification and confidence scores
        """
        right_eye_metrics = self._analyze_single_eye(landmarks, "right")
        left_eye_metrics = self._analyze_single_eye(landmarks, "left")

        # Average metrics from both eyes for final classification
        avg_metrics = self._average_eye_metrics(right_eye_metrics, left_eye_metrics)

        # Classify based on averaged metrics
        classification = self._determine_eye_shape(avg_metrics)

        return {
            "eye_shape": classification["primary_shape"],
            "secondary_features": classification["secondary_features"],
            "confidence_scores": classification["confidence_scores"],
            "metrics": {
                "aspect_ratio": avg_metrics["aspect_ratio"],
                "eyelid_coverage": avg_metrics["eyelid_coverage"],
                "corner_angle": avg_metrics["corner_angle"],
                "right_eye": right_eye_metrics,
                "left_eye": left_eye_metrics,
            },
        }

    def _analyze_single_eye(self, landmarks: List[Dict], eye_side: str) -> Dict:
        """
        Analyze metrics for a single eye

        Args:
            landmarks: Full list of facial landmarks
            eye_side: 'right' or 'left'

        Returns:
            Dictionary with eye metrics
        """
        eye_landmarks = (
            self.RIGHT_EYE_LANDMARKS if eye_side == "right" else self.LEFT_EYE_LANDMARKS
        )

        # Extract relevant landmark points
        inner_corner = np.array(
            [
                landmarks[eye_landmarks["inner_corner"]]["x"],
                landmarks[eye_landmarks["inner_corner"]]["y"],
            ]
        )
        outer_corner = np.array(
            [
                landmarks[eye_landmarks["outer_corner"]]["x"],
                landmarks[eye_landmarks["outer_corner"]]["y"],
            ]
        )
        top_center = np.array(
            [
                landmarks[eye_landmarks["top_center"]]["x"],
                landmarks[eye_landmarks["top_center"]]["y"],
            ]
        )
        bottom_center = np.array(
            [
                landmarks[eye_landmarks["bottom_center"]]["x"],
                landmarks[eye_landmarks["bottom_center"]]["y"],
            ]
        )

        # Calculate eye dimensions
        eye_width = np.linalg.norm(outer_corner - inner_corner)
        eye_height = np.linalg.norm(top_center - bottom_center)

        # Calculate aspect ratio (height/width)
        aspect_ratio = eye_height / eye_width if eye_width > 0 else 0

        # Calculate eyelid coverage (upper eyelid visibility)
        eyelid_coverage = self._calculate_eyelid_coverage(landmarks, eye_landmarks)

        # Calculate corner angle (upturned/downturned)
        corner_angle = self._calculate_corner_angle(inner_corner, outer_corner)

        return {
            "aspect_ratio": aspect_ratio,
            "eyelid_coverage": eyelid_coverage,
            "corner_angle": corner_angle,
            "width": eye_width,
            "height": eye_height,
        }

    def _calculate_eyelid_coverage(
        self, landmarks: List[Dict], eye_landmarks: Dict
    ) -> float:
        """
        Calculate upper eyelid visibility metric

        Higher values = more visible eyelid (almond eyes)
        Lower values = less visible eyelid (hooded/monolid)

        Args:
            landmarks: Full list of facial landmarks
            eye_landmarks: Dictionary of eye-specific landmark indices

        Returns:
            Float representing eyelid visibility ratio
        """
        # Get upper eyelid points
        upper_lid_indices = eye_landmarks["upper_lid"]
        upper_lid_points = [
            np.array([landmarks[idx]["x"], landmarks[idx]["y"]])
            for idx in upper_lid_indices
        ]

        # Calculate average y-coordinate of upper eyelid
        upper_lid_y = np.mean([pt[1] for pt in upper_lid_points])

        # Get top center point (highest point of eye)
        top_center_y = landmarks[eye_landmarks["top_center"]]["y"]

        # Get bottom center point
        bottom_center_y = landmarks[eye_landmarks["bottom_center"]]["y"]

        # Calculate total eye height
        total_eye_height = bottom_center_y - top_center_y

        # Calculate visible eyelid height
        eyelid_height = upper_lid_y - top_center_y

        # Return ratio of visible eyelid to total eye height
        coverage_ratio = eyelid_height / total_eye_height if total_eye_height > 0 else 0

        return abs(coverage_ratio)

    def _calculate_corner_angle(
        self, inner_corner: np.ndarray, outer_corner: np.ndarray
    ) -> float:
        """
        Calculate the angle of the eye corners relative to horizontal

        Positive angle = upturned (outer corner higher)
        Negative angle = downturned (outer corner lower)

        Args:
            inner_corner: Numpy array [x, y] of inner corner
            outer_corner: Numpy array [x, y] of outer corner

        Returns:
            Angle in degrees
        """
        # Calculate vector from inner to outer corner
        dx = outer_corner[0] - inner_corner[0]
        dy = outer_corner[1] - inner_corner[1]

        # Calculate angle in degrees
        # Note: In image coordinates, y increases downward, so we negate dy
        angle = np.degrees(np.arctan2(-dy, dx))

        return angle

    def _average_eye_metrics(self, right_metrics: Dict, left_metrics: Dict) -> Dict:
        """
        Average the metrics from both eyes

        Args:
            right_metrics: Metrics from right eye
            left_metrics: Metrics from left eye

        Returns:
            Dictionary of averaged metrics
        """
        return {
            "aspect_ratio": (
                right_metrics["aspect_ratio"] + left_metrics["aspect_ratio"]
            )
            / 2,
            "eyelid_coverage": (
                right_metrics["eyelid_coverage"] + left_metrics["eyelid_coverage"]
            )
            / 2,
            "corner_angle": (
                right_metrics["corner_angle"] + left_metrics["corner_angle"]
            )
            / 2,
        }

    def _determine_eye_shape(self, metrics: Dict) -> Dict:
        """
        Determine primary eye shape and secondary features based on metrics

        Classification logic:
        1. First check for monolid/hooded (based on eyelid coverage)
        2. Then check for upturned/downturned (based on corner angle)
        3. Finally classify as round/almond based on aspect ratio

        Args:
            metrics: Dictionary of averaged eye metrics

        Returns:
            Dictionary with primary shape, secondary features, and confidence scores
        """
        aspect_ratio = metrics["aspect_ratio"]
        eyelid_coverage = metrics["eyelid_coverage"]
        corner_angle = metrics["corner_angle"]

        primary_shape = None
        secondary_features = []
        confidence_scores = {}

        # Check for monolid (very low eyelid visibility)
        if eyelid_coverage < self.THRESHOLDS["eyelid_coverage"]["monolid_max"]:
            primary_shape = "Monolid"
            confidence_scores["Monolid"] = 0.9
        # Check for hooded (low-moderate eyelid visibility)
        elif eyelid_coverage < self.THRESHOLDS["eyelid_coverage"]["hooded_max"]:
            primary_shape = "Hooded"
            confidence_scores["Hooded"] = 0.85
        # Check for round eyes (higher aspect ratio)
        elif aspect_ratio > self.THRESHOLDS["aspect_ratio"]["round_min"]:
            primary_shape = "Round"
            confidence_scores["Round"] = 0.8
        # Default to almond
        else:
            primary_shape = "Almond"
            confidence_scores["Almond"] = 0.75

        # Check for upturned/downturned as secondary feature
        if corner_angle > self.THRESHOLDS["corner_angle"]["upturned_min"]:
            secondary_features.append("Upturned")
            confidence_scores["Upturned"] = min(
                0.9, corner_angle / 10
            )  # Scale confidence
        elif corner_angle < self.THRESHOLDS["corner_angle"]["downturned_max"]:
            secondary_features.append("Downturned")
            confidence_scores["Downturned"] = min(0.9, abs(corner_angle) / 10)

        return {
            "primary_shape": primary_shape,
            "secondary_features": secondary_features,
            "confidence_scores": confidence_scores,
        }
