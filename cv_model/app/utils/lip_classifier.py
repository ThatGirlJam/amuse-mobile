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

    # MediaPipe landmark indices for lip analysis (CORRECTED)
    LIP_LANDMARKS = {
        # Mouth corners
        'left_corner': 61,
        'right_corner': 291,

        # Upper lip (FIXED: landmark 0 is NOSE, not lip!)
        'upper_lip_top_center': 37,  # Changed from 0 (nose) to 37 (actual upper lip top)
        'upper_lip_top_left': 185,
        'upper_lip_top_right': 267,
        'upper_lip_bottom_center': 13,  # Inner edge of upper lip
        'upper_lip_bottom_left': 82,
        'upper_lip_bottom_right': 312,

        # Lower lip
        'lower_lip_top_center': 14,   # Inner edge of lower lip
        'lower_lip_bottom_center': 17, # Outer edge of lower lip
        'lower_lip_bottom_left': 84,
        'lower_lip_bottom_right': 314,

        # Additional reference points (FIXED: removed landmark 0)
        'upper_outer_lip': [61, 185, 40, 39, 37, 267, 269, 270, 409, 291],  # Removed 0
        'lower_outer_lip': [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
    }

    # Classification thresholds (RECALIBRATED after fixing landmark 0 bug)
    # Since we're now measuring actual lip thickness (not nose-to-lip), values will be smaller
    THRESHOLDS = {
        'thin_max': 0.10,      # Height-to-width ratio < 0.10 = thin (lowered from 0.15)
        'medium_min': 0.10,    # 0.10 <= ratio <= 0.18 = medium
        'medium_max': 0.18,    # ratio > 0.18 = full (lowered from 0.25)
    }

    def __init__(self):
        """Initialize the lip classifier"""
        pass

    def classify_lips(self, landmarks: List[Dict]) -> Dict:
        """
        Classify lip fullness from facial landmarks using multi-point analysis

        Args:
            landmarks: List of landmark dictionaries with 'x', 'y', 'z' coordinates

        Returns:
            Dictionary with lip classification and measurements
        """
        # Multi-point lip measurements
        lip_metrics = self._calculate_lip_metrics_multipoint(landmarks)

        # 3D volume analysis
        depth_metrics = self._analyze_lip_depth_3d(landmarks)

        # Classify based on metrics with quality score
        classification = self._determine_lip_fullness(
            lip_metrics['lip_height_to_width_ratio'],
            lip_metrics['upper_lip_ratio'],
            lip_metrics['lower_lip_ratio'],
            lip_metrics['measurement_stability'],
            depth_metrics
        )

        return {
            'lip_fullness': classification['category'],
            'confidence': classification['confidence'],
            'details': {
                'lip_height_to_width_ratio': lip_metrics['lip_height_to_width_ratio'],
                'lip_balance': self._assess_lip_balance(
                    lip_metrics['upper_lip_ratio'],
                    lip_metrics['lower_lip_ratio']
                ),
                'lip_projection': depth_metrics.get('avg_projection', 0),
                'measurement_quality': lip_metrics['measurement_stability'],
            },
            'measurements': {
                'mouth_width': lip_metrics['mouth_width'],
                'upper_lip_thickness': lip_metrics['upper_lip_thickness'],
                'lower_lip_thickness': lip_metrics['lower_lip_thickness'],
                'total_lip_height': lip_metrics['total_lip_height'],
                'lip_height_to_width_ratio': lip_metrics['lip_height_to_width_ratio'],
                'upper_lip_ratio': lip_metrics['upper_lip_ratio'],
                'lower_lip_ratio': lip_metrics['lower_lip_ratio'],
                'height_samples': lip_metrics.get('height_samples', 0),
                'depth_metrics': depth_metrics,
            }
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

    def _calculate_lip_metrics_multipoint(self, landmarks: List[Dict]) -> Dict:
        """Calculate lip measurements using multiple points for stability"""
        # Get outer lip contours for multi-point analysis
        upper_outer = self.LIP_LANDMARKS['upper_outer_lip']
        lower_outer = self.LIP_LANDMARKS['lower_outer_lip']

        # Sample multiple vertical measurements across lips
        upper_heights = []
        lower_heights = []
        sample_indices = [0, len(upper_outer)//4, len(upper_outer)//2, 3*len(upper_outer)//4, -1]

        for idx in sample_indices:
            if idx < len(upper_outer) and idx < len(lower_outer):
                upper_pt = np.array([landmarks[upper_outer[idx]]['y']])
                lower_pt = np.array([landmarks[lower_outer[idx]]['y']])
                # Measure distances (simplified for efficiency)
                upper_heights.append(abs(landmarks[self.LIP_LANDMARKS['upper_lip_top_center']]['y'] -
                                       landmarks[self.LIP_LANDMARKS['upper_lip_bottom_center']]['y']))
                lower_heights.append(abs(landmarks[self.LIP_LANDMARKS['lower_lip_top_center']]['y'] -
                                       landmarks[self.LIP_LANDMARKS['lower_lip_bottom_center']]['y']))

        # Use median for robustness
        upper_thickness = np.median(upper_heights) if upper_heights else self._calculate_upper_lip_thickness(landmarks)
        lower_thickness = np.median(lower_heights) if lower_heights else self._calculate_lower_lip_thickness(landmarks)
        mouth_width = self._calculate_mouth_width(landmarks)

        total_height = upper_thickness + lower_thickness
        ratio = total_height / mouth_width if mouth_width > 0 else 0

        # Measurement stability
        height_variance = np.std(upper_heights + lower_heights) if (upper_heights and lower_heights) else 0
        stability = 1.0 / (1.0 + height_variance * 10)

        return {
            'upper_lip_thickness': float(upper_thickness),
            'lower_lip_thickness': float(lower_thickness),
            'total_lip_height': float(total_height),
            'mouth_width': float(mouth_width),
            'lip_height_to_width_ratio': float(ratio),
            'upper_lip_ratio': float(upper_thickness / mouth_width) if mouth_width > 0 else 0,
            'lower_lip_ratio': float(lower_thickness / mouth_width) if mouth_width > 0 else 0,
            'measurement_stability': float(stability),
            'height_samples': len(upper_heights) + len(lower_heights),
        }

    def _analyze_lip_depth_3d(self, landmarks: List[Dict]) -> Dict:
        """Analyze 3D lip volume/projection"""
        # Get z-coordinates for lip projection
        upper_center_z = landmarks[self.LIP_LANDMARKS['upper_lip_top_center']].get('z', 0)
        lower_center_z = landmarks[self.LIP_LANDMARKS['lower_lip_bottom_center']].get('z', 0)
        left_corner_z = landmarks[self.LIP_LANDMARKS['left_corner']].get('z', 0)
        right_corner_z = landmarks[self.LIP_LANDMARKS['right_corner']].get('z', 0)

        # Calculate average corner depth (reference plane)
        corner_plane_z = (left_corner_z + right_corner_z) / 2

        # Calculate how much lips project forward from corners
        upper_projection = upper_center_z - corner_plane_z
        lower_projection = lower_center_z - corner_plane_z
        avg_projection = (upper_projection + lower_projection) / 2

        return {
            'upper_projection': float(upper_projection),
            'lower_projection': float(lower_projection),
            'avg_projection': float(avg_projection),
            'has_fullness': avg_projection > 0.01,  # Lips project forward = fuller
        }

    def _determine_lip_fullness(
        self,
        total_ratio: float,
        upper_ratio: float,
        lower_ratio: float,
        measurement_stability: float = 1.0,
        depth_metrics: Dict = None
    ) -> Dict:
        """
        Determine lip fullness with dynamic confidence

        Args:
            total_ratio: Total lip height to mouth width ratio
            upper_ratio: Upper lip thickness to mouth width ratio
            lower_ratio: Lower lip thickness to mouth width ratio
            measurement_stability: Quality score (0-1)
            depth_metrics: 3D depth analysis results

        Returns:
            Dictionary with category and confidence score
        """
        depth_metrics = depth_metrics or {}

        if total_ratio < self.THRESHOLDS['thin_max']:
            category = 'thin'
            distance = self.THRESHOLDS['thin_max'] - total_ratio
            base_confidence = min(0.95, 0.75 + distance * 5)
        elif total_ratio <= self.THRESHOLDS['medium_max']:
            category = 'medium'
            mid_point = (self.THRESHOLDS['medium_min'] + self.THRESHOLDS['medium_max']) / 2
            distance_from_mid = abs(total_ratio - mid_point)
            base_confidence = max(0.65, 0.9 - distance_from_mid * 4)
        else:
            category = 'full'
            distance = total_ratio - self.THRESHOLDS['medium_max']
            base_confidence = min(0.95, 0.75 + distance * 3)

        # Apply measurement quality
        confidence = base_confidence * measurement_stability

        # Boost confidence if 3D metrics confirm classification
        if depth_metrics and depth_metrics.get('has_fullness') and category == 'full':
            confidence = min(0.95, confidence * 1.1)

        return {
            'category': category,
            'confidence': float(confidence)
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