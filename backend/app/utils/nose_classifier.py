"""
Nose Width Classification Module

Uses MediaPipe face landmark indices to classify nose width into three categories:
- Narrow: Nose-to-face width ratio < 0.25
- Medium: Nose-to-face width ratio 0.25 - 0.35
- Wide: Nose-to-face width ratio > 0.35

MediaPipe Face Mesh Nose Landmark Indices:
- Nose tip: 1
- Left nostril outer: 98
- Right nostril outer: 327
- Left nostril inner: 219
- Right nostril inner: 439
- Nose bridge top: 168
- Left ala (side of nose): 129
- Right ala (side of nose): 358
- Left cheek (for face width): 234
- Right cheek (for face width): 454
"""

import numpy as np
from typing import List, Dict


class NoseClassifier:
    """
    Classifies nose width based on geometric analysis of facial landmarks
    """

    # MediaPipe landmark indices for nose analysis
    NOSE_LANDMARKS = {
        'tip': 1,
        'left_nostril': 98,
        'right_nostril': 327,
        'left_ala': 129,  # Wing of nose
        'right_ala': 358,  # Wing of nose
        'bridge_top': 168,
        'left_inner_nostril': 219,
        'right_inner_nostril': 439
    }

    # Face landmarks for width reference
    FACE_LANDMARKS = {
        'left_cheek': 234,   # Approximate cheekbone position
        'right_cheek': 454,  # Approximate cheekbone position
        'left_face_contour': 127,
        'right_face_contour': 356
    }

    # Classification thresholds
    THRESHOLDS = {
        'narrow_max': 0.25,   # Nose-to-face width ratio < 0.25 = narrow
        'medium_min': 0.25,   # 0.25 <= ratio <= 0.35 = medium
        'medium_max': 0.35,   # ratio > 0.35 = wide
    }

    def __init__(self):
        """Initialize the nose classifier"""
        pass

    def classify_nose(self, landmarks: List[Dict]) -> Dict:
        """
        Classify nose width from facial landmarks

        Args:
            landmarks: List of landmark dictionaries with 'x', 'y', 'z' coordinates

        Returns:
            Dictionary with nose classification and measurements
        """
        # Calculate nose width at nostrils
        nose_width = self._calculate_nose_width(landmarks)

        # Calculate face width at same vertical position
        face_width = self._calculate_face_width(landmarks)

        # Calculate ratio
        nose_to_face_ratio = nose_width / face_width if face_width > 0 else 0

        # Classify based on ratio
        classification = self._determine_nose_width(nose_to_face_ratio)

        # Calculate additional metrics
        nostril_width = self._calculate_nostril_width(landmarks)
        bridge_width = self._calculate_bridge_width(landmarks)

        return {
            'nose_width': classification['category'],
            'confidence': classification['confidence'],
            'measurements': {
                'nose_width': nose_width,
                'face_width': face_width,
                'nose_to_face_ratio': nose_to_face_ratio,
                'nostril_width': nostril_width,
                'bridge_width': bridge_width
            }
        }

    def _calculate_nose_width(self, landmarks: List[Dict]) -> float:
        """
        Calculate the width of the nose at the widest point (nostrils/ala)

        Args:
            landmarks: Full list of facial landmarks

        Returns:
            Float representing nose width
        """
        # Get left and right ala (wings of nose) - widest part
        left_ala = np.array([
            landmarks[self.NOSE_LANDMARKS['left_ala']]['x'],
            landmarks[self.NOSE_LANDMARKS['left_ala']]['y']
        ])
        right_ala = np.array([
            landmarks[self.NOSE_LANDMARKS['right_ala']]['x'],
            landmarks[self.NOSE_LANDMARKS['right_ala']]['y']
        ])

        # Calculate Euclidean distance
        nose_width = np.linalg.norm(right_ala - left_ala)

        return nose_width

    def _calculate_face_width(self, landmarks: List[Dict]) -> float:
        """
        Calculate face width at approximately the same vertical position as nose

        Args:
            landmarks: Full list of facial landmarks

        Returns:
            Float representing face width
        """
        # Get cheek/face contour points at similar vertical position to nose
        left_cheek = np.array([
            landmarks[self.FACE_LANDMARKS['left_cheek']]['x'],
            landmarks[self.FACE_LANDMARKS['left_cheek']]['y']
        ])
        right_cheek = np.array([
            landmarks[self.FACE_LANDMARKS['right_cheek']]['x'],
            landmarks[self.FACE_LANDMARKS['right_cheek']]['y']
        ])

        # Calculate Euclidean distance
        face_width = np.linalg.norm(right_cheek - left_cheek)

        return face_width

    def _calculate_nostril_width(self, landmarks: List[Dict]) -> float:
        """
        Calculate the width between inner nostrils

        Args:
            landmarks: Full list of facial landmarks

        Returns:
            Float representing nostril width
        """
        left_nostril = np.array([
            landmarks[self.NOSE_LANDMARKS['left_nostril']]['x'],
            landmarks[self.NOSE_LANDMARKS['left_nostril']]['y']
        ])
        right_nostril = np.array([
            landmarks[self.NOSE_LANDMARKS['right_nostril']]['x'],
            landmarks[self.NOSE_LANDMARKS['right_nostril']]['y']
        ])

        nostril_width = np.linalg.norm(right_nostril - left_nostril)

        return nostril_width

    def _calculate_bridge_width(self, landmarks: List[Dict]) -> float:
        """
        Calculate approximate nasal bridge width (for future refinement)

        For now, uses a simplified calculation based on nearby landmarks

        Args:
            landmarks: Full list of facial landmarks

        Returns:
            Float representing approximate bridge width
        """
        # Using landmarks near the bridge
        # This is a simplified calculation and can be refined
        left_bridge = np.array([
            landmarks[self.NOSE_LANDMARKS['left_inner_nostril']]['x'],
            landmarks[self.NOSE_LANDMARKS['left_inner_nostril']]['y']
        ])
        right_bridge = np.array([
            landmarks[self.NOSE_LANDMARKS['right_inner_nostril']]['x'],
            landmarks[self.NOSE_LANDMARKS['right_inner_nostril']]['y']
        ])

        bridge_width = np.linalg.norm(right_bridge - left_bridge)

        return bridge_width

    def _determine_nose_width(self, ratio: float) -> Dict:
        """
        Determine nose width category based on nose-to-face ratio

        Args:
            ratio: Nose width to face width ratio

        Returns:
            Dictionary with category and confidence score
        """
        if ratio < self.THRESHOLDS['narrow_max']:
            category = 'narrow'
            # Confidence increases as ratio gets smaller
            confidence = 0.9 if ratio < 0.20 else 0.75
        elif ratio <= self.THRESHOLDS['medium_max']:
            category = 'medium'
            # Higher confidence for ratios in middle of range
            mid_point = (self.THRESHOLDS['medium_min'] + self.THRESHOLDS['medium_max']) / 2
            confidence = 0.85 if abs(ratio - mid_point) < 0.03 else 0.75
        else:
            category = 'wide'
            # Confidence increases as ratio gets larger
            confidence = 0.9 if ratio > 0.40 else 0.75

        return {
            'category': category,
            'confidence': confidence
        }