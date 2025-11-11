"""
Lip Fullness Classification Module

Uses MediaPipe face landmark indices to classify lip fullness into three categories:
- Thin: Lip height-to-width ratio < 0.15
- Medium: Lip height-to-width ratio 0.15 - 0.25
- Full: Lip height-to-width ratio > 0.25

MediaPipe Face Mesh Lip Landmark Indices:
- Outer lip boundary: 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291
- Left mouth corner: 61
- Right mouth corner: 291
- Upper lip center (cupid's bow): 0
- Lower lip center: 17
- Upper lip top points: 37, 0, 267
- Upper lip bottom points: 82, 13, 312
- Lower lip top points: 82, 13, 312
- Lower lip bottom points: 84, 17, 314
"""

import numpy as np
from typing import List, Dict


class LipClassifier:
    """
    Classifies lip fullness based on geometric analysis of facial landmarks
    """

    # MediaPipe landmark indices for lip analysis
    LIP_LANDMARKS = {
        # Mouth corners
        'left_corner': 61,
        'right_corner': 291,

        # Upper lip
        'upper_lip_top_center': 0,
        'upper_lip_top_left': 37,
        'upper_lip_top_right': 267,
        'upper_lip_bottom_center': 13,
        'upper_lip_bottom_left': 82,
        'upper_lip_bottom_right': 312,

        # Lower lip
        'lower_lip_top_center': 14,
        'lower_lip_bottom_center': 17,
        'lower_lip_bottom_left': 84,
        'lower_lip_bottom_right': 314,

        # Additional reference points
        'upper_outer_lip': [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
        'lower_outer_lip': [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
    }

    # Classification thresholds
    THRESHOLDS = {
        'thin_max': 0.15,      # Height-to-width ratio < 0.15 = thin
        'medium_min': 0.15,    # 0.15 <= ratio <= 0.25 = medium
        'medium_max': 0.25,    # ratio > 0.25 = full
    }

    def __init__(self):
        """Initialize the lip classifier"""
        pass

    def classify_lips(self, landmarks: List[Dict]) -> Dict:
        """
        Classify lip fullness from facial landmarks

        Args:
            landmarks: List of landmark dictionaries with 'x', 'y', 'z' coordinates

        Returns:
            Dictionary with lip classification and measurements
        """
        # Calculate mouth width
        mouth_width = self._calculate_mouth_width(landmarks)

        # Calculate upper lip thickness
        upper_lip_thickness = self._calculate_upper_lip_thickness(landmarks)

        # Calculate lower lip thickness
        lower_lip_thickness = self._calculate_lower_lip_thickness(landmarks)

        # Calculate total lip height
        total_lip_height = upper_lip_thickness + lower_lip_thickness

        # Calculate lip-to-mouth width ratio
        lip_height_to_width_ratio = total_lip_height / mouth_width if mouth_width > 0 else 0

        # Calculate individual lip ratios
        upper_lip_ratio = upper_lip_thickness / mouth_width if mouth_width > 0 else 0
        lower_lip_ratio = lower_lip_thickness / mouth_width if mouth_width > 0 else 0

        # Classify based on ratio
        classification = self._determine_lip_fullness(
            lip_height_to_width_ratio,
            upper_lip_ratio,
            lower_lip_ratio
        )

        return {
            'lip_fullness': classification['category'],
            'confidence': classification['confidence'],
            'measurements': {
                'mouth_width': mouth_width,
                'upper_lip_thickness': upper_lip_thickness,
                'lower_lip_thickness': lower_lip_thickness,
                'total_lip_height': total_lip_height,
                'lip_height_to_width_ratio': lip_height_to_width_ratio,
                'upper_lip_ratio': upper_lip_ratio,
                'lower_lip_ratio': lower_lip_ratio
            },
            'lip_balance': self._assess_lip_balance(upper_lip_ratio, lower_lip_ratio)
        }

    def _calculate_mouth_width(self, landmarks: List[Dict]) -> float:
        """
        Calculate the width of the mouth (distance between corners)

        Args:
            landmarks: Full list of facial landmarks

        Returns:
            Float representing mouth width
        """
        left_corner = np.array([
            landmarks[self.LIP_LANDMARKS['left_corner']]['x'],
            landmarks[self.LIP_LANDMARKS['left_corner']]['y']
        ])
        right_corner = np.array([
            landmarks[self.LIP_LANDMARKS['right_corner']]['x'],
            landmarks[self.LIP_LANDMARKS['right_corner']]['y']
        ])

        mouth_width = np.linalg.norm(right_corner - left_corner)

        return mouth_width

    def _calculate_upper_lip_thickness(self, landmarks: List[Dict]) -> float:
        """
        Calculate the thickness of the upper lip

        Args:
            landmarks: Full list of facial landmarks

        Returns:
            Float representing upper lip thickness
        """
        # Get top and bottom center points of upper lip
        upper_top = np.array([
            landmarks[self.LIP_LANDMARKS['upper_lip_top_center']]['x'],
            landmarks[self.LIP_LANDMARKS['upper_lip_top_center']]['y']
        ])
        upper_bottom = np.array([
            landmarks[self.LIP_LANDMARKS['upper_lip_bottom_center']]['x'],
            landmarks[self.LIP_LANDMARKS['upper_lip_bottom_center']]['y']
        ])

        # Calculate vertical distance
        upper_lip_thickness = np.linalg.norm(upper_top - upper_bottom)

        return upper_lip_thickness

    def _calculate_lower_lip_thickness(self, landmarks: List[Dict]) -> float:
        """
        Calculate the thickness of the lower lip

        Args:
            landmarks: Full list of facial landmarks

        Returns:
            Float representing lower lip thickness
        """
        # Get top and bottom center points of lower lip
        lower_top = np.array([
            landmarks[self.LIP_LANDMARKS['lower_lip_top_center']]['x'],
            landmarks[self.LIP_LANDMARKS['lower_lip_top_center']]['y']
        ])
        lower_bottom = np.array([
            landmarks[self.LIP_LANDMARKS['lower_lip_bottom_center']]['x'],
            landmarks[self.LIP_LANDMARKS['lower_lip_bottom_center']]['y']
        ])

        # Calculate vertical distance
        lower_lip_thickness = np.linalg.norm(lower_top - lower_bottom)

        return lower_lip_thickness

    def _determine_lip_fullness(
        self,
        total_ratio: float,
        upper_ratio: float,
        lower_ratio: float
    ) -> Dict:
        """
        Determine lip fullness category based on lip-to-mouth ratios

        Args:
            total_ratio: Total lip height to mouth width ratio
            upper_ratio: Upper lip thickness to mouth width ratio
            lower_ratio: Lower lip thickness to mouth width ratio

        Returns:
            Dictionary with category and confidence score
        """
        if total_ratio < self.THRESHOLDS['thin_max']:
            category = 'thin'
            # Higher confidence for very thin lips
            confidence = 0.9 if total_ratio < 0.12 else 0.8
        elif total_ratio <= self.THRESHOLDS['medium_max']:
            category = 'medium'
            # Higher confidence for ratios in middle of range
            mid_point = (self.THRESHOLDS['medium_min'] + self.THRESHOLDS['medium_max']) / 2
            confidence = 0.85 if abs(total_ratio - mid_point) < 0.03 else 0.75
        else:
            category = 'full'
            # Higher confidence for very full lips
            confidence = 0.9 if total_ratio > 0.30 else 0.8

        return {
            'category': category,
            'confidence': confidence
        }

    def _assess_lip_balance(self, upper_ratio: float, lower_ratio: float) -> str:
        """
        Assess the balance between upper and lower lips

        Args:
            upper_ratio: Upper lip thickness ratio
            lower_ratio: Lower lip thickness ratio

        Returns:
            String describing lip balance
        """
        ratio_difference = abs(upper_ratio - lower_ratio)

        # Calculate which lip is fuller
        if ratio_difference < 0.02:
            return 'balanced'
        elif upper_ratio > lower_ratio:
            if ratio_difference > 0.05:
                return 'upper_dominant'
            else:
                return 'slightly_upper_dominant'
        else:
            if ratio_difference > 0.05:
                return 'lower_dominant'
            else:
                return 'slightly_lower_dominant'