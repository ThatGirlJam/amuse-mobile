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

    # Classification thresholds (recalibrated for maximum sensitivity)
    THRESHOLDS = {
        "aspect_ratio": {
            "round_min": 0.50,  # Height/width > 0.50 indicates rounder eye
            "almond_min": 0.30,  # Minimum for almond
            "almond_max": 0.50,  # Maximum for almond
        },
        "eyelid_coverage": {
            "monolid_max": 0.12,  # Very low upper eyelid visibility
            "hooded_max": 0.30,  # Low to moderate upper eyelid visibility
        },
        "corner_angle": {
            "upturned_min": 0.3,  # Y-diff threshold (simplified from degrees)
            "downturned_max": -0.3,  # Y-diff threshold
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

        # Calculate measurement quality score
        measurement_quality = (
            right_eye_metrics["measurement_stability"] +
            left_eye_metrics["measurement_stability"]
        ) / 2

        # Classify based on averaged metrics with quality score
        classification = self._determine_eye_shape(avg_metrics, measurement_quality)

        return {
            "eye_shape": classification["primary_shape"],
            "secondary_features": classification["secondary_features"],
            "confidence_scores": classification["confidence_scores"],
            "confidence": classification["overall_confidence"],  # NEW: single overall confidence
            "details": {
                "aspect_ratio": avg_metrics["aspect_ratio"],
                "eyelid_coverage": avg_metrics["eyelid_coverage"],
                "corner_angle": avg_metrics["corner_angle"],
                "depth_metrics": avg_metrics.get("depth_metrics", {}),
                "measurement_quality": measurement_quality,
            },
            "metrics": {
                "right_eye": right_eye_metrics,
                "left_eye": left_eye_metrics,
            },
        }

    def _analyze_single_eye(self, landmarks: List[Dict], eye_side: str) -> Dict:
        """
        Analyze metrics for a single eye using multi-point averaging and 3D analysis

        Args:
            landmarks: Full list of facial landmarks
            eye_side: 'right' or 'left'

        Returns:
            Dictionary with eye metrics
        """
        eye_landmarks = (
            self.RIGHT_EYE_LANDMARKS if eye_side == "right" else self.LEFT_EYE_LANDMARKS
        )

        # Multi-point width calculation: average multiple horizontal distances
        inner_corner = np.array(
            [
                landmarks[eye_landmarks["inner_corner"]]["x"],
                landmarks[eye_landmarks["inner_corner"]]["y"],
                landmarks[eye_landmarks["inner_corner"]].get("z", 0),
            ]
        )
        outer_corner = np.array(
            [
                landmarks[eye_landmarks["outer_corner"]]["x"],
                landmarks[eye_landmarks["outer_corner"]]["y"],
                landmarks[eye_landmarks["outer_corner"]].get("z", 0),
            ]
        )

        # Multi-point height calculation: average multiple vertical measurements
        upper_lid_indices = eye_landmarks["upper_lid"]
        lower_lid_indices = eye_landmarks["lower_lid"]

        # Get multiple height measurements across eye (improved sampling)
        heights = []
        num_samples = min(len(upper_lid_indices), len(lower_lid_indices))

        for i in range(num_samples):
            upper_pt = np.array([
                landmarks[upper_lid_indices[i]]["x"],
                landmarks[upper_lid_indices[i]]["y"],
            ])
            lower_pt = np.array([
                landmarks[lower_lid_indices[i]]["x"],
                landmarks[lower_lid_indices[i]]["y"],
            ])

            # Calculate vertical distance (absolute difference in y-coordinates)
            # Since landmarks are normalized to 0-1, this gives a relative height
            height = abs(upper_pt[1] - lower_pt[1])

            # Only include reasonable measurements (filter outliers)
            if 0.001 < height < 0.5:  # Sanity check: eye height should be between 0.1% and 50% of image
                heights.append(height)

        # Use median height for robustness against outliers
        if heights:
            eye_height = float(np.median(heights))
        else:
            # Fallback to simple center measurement
            eye_height = abs(
                landmarks[eye_landmarks["top_center"]]["y"] -
                landmarks[eye_landmarks["bottom_center"]]["y"]
            )

        # Calculate eye width (2D distance for aspect ratio)
        eye_width = np.linalg.norm(outer_corner[:2] - inner_corner[:2])

        # Ensure valid width
        if eye_width < 0.001:
            eye_width = 0.001  # Prevent division by zero

        # Calculate aspect ratio (height/width)
        aspect_ratio = eye_height / eye_width if eye_width > 0 else 0

        # Clamp aspect ratio to reasonable range (0-1 for normalized coordinates)
        aspect_ratio = max(0.0, min(1.0, aspect_ratio))

        # Calculate eyelid coverage (upper eyelid visibility)
        eyelid_coverage = self._calculate_eyelid_coverage(landmarks, eye_landmarks)

        # Calculate corner angle (upturned/downturned)
        corner_angle = self._calculate_corner_angle(inner_corner[:2], outer_corner[:2])

        # 3D depth analysis for hooded/deep-set detection
        depth_metrics = self._analyze_eye_depth_3d(landmarks, eye_landmarks)

        # Calculate measurement stability (confidence indicator)
        height_variance = np.std(heights) if len(heights) > 1 else 0
        measurement_stability = 1.0 / (1.0 + height_variance * 10)  # 0-1 score

        return {
            "aspect_ratio": float(aspect_ratio),
            "eyelid_coverage": float(eyelid_coverage),
            "corner_angle": float(corner_angle),
            "width": float(eye_width),
            "height": float(eye_height),
            "depth_metrics": depth_metrics,
            "measurement_stability": float(measurement_stability),
            "height_samples": len(heights),
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

        # Calculate total eye height (absolute difference)
        total_eye_height = abs(bottom_center_y - top_center_y)

        # Calculate visible eyelid height (absolute difference)
        eyelid_height = abs(upper_lid_y - top_center_y)

        # Return ratio of visible eyelid to total eye height
        if total_eye_height > 0.001:  # Prevent division by zero
            coverage_ratio = eyelid_height / total_eye_height
        else:
            coverage_ratio = 0.5  # Default to mid-range if calculation fails

        # Clamp to reasonable range (0-1)
        coverage_ratio = max(0.0, min(1.0, coverage_ratio))

        return float(coverage_ratio)

    def _calculate_corner_angle(
        self, inner_corner: np.ndarray, outer_corner: np.ndarray
    ) -> float:
        """
        Calculate eye tilt using simple y-coordinate difference

        SIMPLIFIED: Just use the y-difference directly
        Positive = upturned (outer corner higher = smaller y value)
        Negative = downturned (outer corner lower = larger y value)

        Args:
            inner_corner: Numpy array [x, y] of inner corner
            outer_corner: Numpy array [x, y] of outer corner

        Returns:
            Tilt value (positive = upturned, negative = downturned)
        """
        # Simple: just use y-coordinate difference
        # In image coords, y increases downward, so:
        # - If outer_y < inner_y (outer is higher), it's upturned → positive value
        # - If outer_y > inner_y (outer is lower), it's downturned → negative value

        y_diff = inner_corner[1] - outer_corner[1]  # Positive if outer is higher

        # Scale to reasonable range (multiply by 100 to match old threshold scale)
        tilt = y_diff * 100

        return float(tilt)

    def _analyze_eye_depth_3d(self, landmarks: List[Dict], eye_landmarks: Dict) -> Dict:
        """
        Analyze eye depth using 3D z-coordinates to detect hooded/deep-set eyes

        Deep-set eyes have upper lid/brow significantly behind the eye plane
        Hooded eyes have upper lid forward but low

        Args:
            landmarks: Full list of facial landmarks
            eye_landmarks: Dictionary of eye-specific landmark indices

        Returns:
            Dictionary with 3D depth metrics
        """
        # Get z-coordinates for key points
        upper_lid_indices = eye_landmarks["upper_lid"]
        lower_lid_indices = eye_landmarks["lower_lid"]

        # Average z-depth of upper lid
        upper_lid_z = np.mean([
            landmarks[idx].get("z", 0) for idx in upper_lid_indices
        ])

        # Average z-depth of lower lid (eye plane reference)
        lower_lid_z = np.mean([
            landmarks[idx].get("z", 0) for idx in lower_lid_indices
        ])

        # Calculate depth difference (negative = upper lid recessed = deep-set/hooded)
        eyelid_depth_diff = upper_lid_z - lower_lid_z

        # Get iris center depth as reference point
        iris_z = landmarks[eye_landmarks["iris_center"]].get("z", 0)

        # Calculate how much upper lid protrudes relative to iris
        lid_to_iris_depth = upper_lid_z - iris_z

        # Classify depth characteristics
        is_deep_set = eyelid_depth_diff < -0.01  # Upper lid significantly recessed
        is_prominent = eyelid_depth_diff > 0.01  # Upper lid protrudes
        depth_variation = abs(eyelid_depth_diff)

        return {
            "eyelid_depth_diff": float(eyelid_depth_diff),
            "lid_to_iris_depth": float(lid_to_iris_depth),
            "is_deep_set": is_deep_set,
            "is_prominent": is_prominent,
            "depth_variation": float(depth_variation),
        }

    def _average_eye_metrics(self, right_metrics: Dict, left_metrics: Dict) -> Dict:
        """
        Average the metrics from both eyes

        Args:
            right_metrics: Metrics from right eye
            left_metrics: Metrics from left eye

        Returns:
            Dictionary of averaged metrics
        """
        # Average 3D depth metrics
        right_depth = right_metrics.get("depth_metrics", {})
        left_depth = left_metrics.get("depth_metrics", {})

        avg_depth_metrics = {}
        if right_depth and left_depth:
            avg_depth_metrics = {
                "eyelid_depth_diff": (
                    right_depth.get("eyelid_depth_diff", 0) +
                    left_depth.get("eyelid_depth_diff", 0)
                ) / 2,
                "is_deep_set": right_depth.get("is_deep_set", False) or left_depth.get("is_deep_set", False),
                "is_prominent": right_depth.get("is_prominent", False) or left_depth.get("is_prominent", False),
            }

        # SIMPLIFIED: Just average the tilt values directly (now they're y-diffs, not angles)
        avg_corner_angle = (
            right_metrics["corner_angle"] + left_metrics["corner_angle"]
        ) / 2

        return {
            "aspect_ratio": (
                right_metrics["aspect_ratio"] + left_metrics["aspect_ratio"]
            )
            / 2,
            "eyelid_coverage": (
                right_metrics["eyelid_coverage"] + left_metrics["eyelid_coverage"]
            )
            / 2,
            "corner_angle": float(avg_corner_angle),  # Simplified: just y-diff
            "depth_metrics": avg_depth_metrics,
        }

    def _determine_eye_shape(self, metrics: Dict, measurement_quality: float = 1.0) -> Dict:
        """
        Determine primary eye shape and secondary features based on metrics

        Improved Classification Logic:
        1. Check for strong angle characteristics (upturned/downturned with strong angle)
        2. Check for monolid/hooded (based on eyelid coverage + 3D depth)
        3. Classify as round/almond based on aspect ratio
        4. Combine shape with angle if both are significant

        Args:
            metrics: Dictionary of averaged eye metrics
            measurement_quality: Quality score (0-1) based on measurement stability

        Returns:
            Dictionary with primary shape, secondary features, and confidence scores
        """
        aspect_ratio = metrics["aspect_ratio"]
        eyelid_coverage = metrics["eyelid_coverage"]
        corner_angle = metrics["corner_angle"]
        depth_metrics = metrics.get("depth_metrics", {})

        primary_shape = None
        secondary_features = []
        confidence_scores = {}

        # Use 3D depth to improve hooded/deep-set detection
        is_deep_set = depth_metrics.get("is_deep_set", False)
        eyelid_depth_diff = depth_metrics.get("eyelid_depth_diff", 0)

        # Determine angle characteristics (upturned/downturned)
        angle_type = None
        angle_confidence = 0.0
        angle_strength = abs(corner_angle) / 15.0  # Normalize to 0-1 (15° = max)

        if corner_angle > self.THRESHOLDS["corner_angle"]["upturned_min"]:
            angle_type = "Upturned"
            angle_confidence = (0.6 + min(angle_strength, 1.0) * 0.35) * measurement_quality
            confidence_scores["Upturned"] = angle_confidence
        elif corner_angle < self.THRESHOLDS["corner_angle"]["downturned_max"]:
            angle_type = "Downturned"
            angle_confidence = (0.6 + min(angle_strength, 1.0) * 0.35) * measurement_quality
            confidence_scores["Downturned"] = angle_confidence

        # Determine base shape (monolid/hooded/round/almond)
        base_shape = None
        base_confidence = 0.0

        # Check for monolid (very low eyelid visibility)
        if eyelid_coverage < self.THRESHOLDS["eyelid_coverage"]["monolid_max"]:
            base_shape = "Monolid"
            distance_from_threshold = self.THRESHOLDS["eyelid_coverage"]["monolid_max"] - eyelid_coverage
            base_confidence = min(0.95, 0.75 + distance_from_threshold * 2) * measurement_quality
            confidence_scores["Monolid"] = base_confidence

        # Check for hooded (low-moderate eyelid visibility OR deep-set)
        elif eyelid_coverage < self.THRESHOLDS["eyelid_coverage"]["hooded_max"] or is_deep_set:
            base_shape = "Hooded"
            if is_deep_set and eyelid_depth_diff < -0.02:
                base_confidence = min(0.95, 0.85 + abs(eyelid_depth_diff) * 5) * measurement_quality
            else:
                distance_from_threshold = self.THRESHOLDS["eyelid_coverage"]["hooded_max"] - eyelid_coverage
                base_confidence = min(0.9, 0.7 + distance_from_threshold * 1.5) * measurement_quality
            confidence_scores["Hooded"] = base_confidence

        # Check for round eyes (higher aspect ratio)
        elif aspect_ratio > self.THRESHOLDS["aspect_ratio"]["round_min"]:
            base_shape = "Round"
            excess_ratio = aspect_ratio - self.THRESHOLDS["aspect_ratio"]["round_min"]
            base_confidence = min(0.95, 0.7 + excess_ratio * 2) * measurement_quality
            confidence_scores["Round"] = base_confidence

        # Default to almond
        else:
            base_shape = "Almond"
            optimal_almond_ratio = (
                self.THRESHOLDS["aspect_ratio"]["almond_min"] +
                self.THRESHOLDS["aspect_ratio"]["almond_max"]
            ) / 2
            distance_from_optimal = abs(aspect_ratio - optimal_almond_ratio)
            base_confidence = max(0.65, 0.9 - distance_from_optimal * 2) * measurement_quality
            confidence_scores["Almond"] = base_confidence

        # NEW LOGIC: Combine angle with base shape if both are significant
        # Make angle-based classification easier to trigger

        if angle_type and angle_confidence > 0.65 and abs(corner_angle) > 3.0:
            # Significant angle characteristic - make it the primary shape
            # (Lowered from confidence > 0.75 and angle > 5.0 to be more sensitive)
            primary_shape = angle_type
            overall_confidence = angle_confidence

            # Add base shape as context if it's not the default almond
            if base_shape and base_shape != "Almond" and base_confidence > 0.65:
                secondary_features.append(base_shape)

        else:
            # Base shape is primary
            primary_shape = base_shape
            overall_confidence = base_confidence

            # Add angle as secondary feature if significant
            if angle_type and angle_confidence > 0.60:
                secondary_features.append(angle_type)

        return {
            "primary_shape": primary_shape,
            "secondary_features": secondary_features,
            "confidence_scores": confidence_scores,
            "overall_confidence": float(overall_confidence),
        }
