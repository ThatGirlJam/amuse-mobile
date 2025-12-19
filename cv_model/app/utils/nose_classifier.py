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
        Classify nose width from facial landmarks using multi-point analysis

        Args:
            landmarks: List of landmark dictionaries with 'x', 'y', 'z' coordinates

        Returns:
            Dictionary with nose classification and measurements
        """
        # Multi-point nose width calculation
        nose_metrics = self._calculate_nose_metrics_multipoint(landmarks)

        # Calculate face width at same vertical position
        face_width = self._calculate_face_width(landmarks)

        # Calculate ratio
        nose_to_face_ratio = nose_metrics['avg_width'] / face_width if face_width > 0 else 0

        # NEW: 3D analysis for nose projection/prominence
        depth_metrics = self._analyze_nose_depth_3d(landmarks)

        # Classify based on ratio with measurement quality
        classification = self._determine_nose_width(
            nose_to_face_ratio,
            nose_metrics['measurement_stability'],
            depth_metrics
        )

        # Calculate additional metrics
        nostril_width = self._calculate_nostril_width(landmarks)
        bridge_width = self._calculate_bridge_width(landmarks)

        return {
            'nose_width': classification['category'],
            'confidence': classification['confidence'],
            'details': {
                'nose_to_face_ratio': nose_to_face_ratio,
                'nostril_flare': nose_metrics.get('nostril_flare', 0),
                'bridge_prominence': depth_metrics.get('bridge_prominence', 0),
                'measurement_quality': nose_metrics['measurement_stability'],
            },
            'measurements': {
                'nose_width': nose_metrics['avg_width'],
                'face_width': face_width,
                'nose_to_face_ratio': nose_to_face_ratio,
                'nostril_width': nostril_width,
                'bridge_width': bridge_width,
                'width_samples': nose_metrics['sample_count'],
                'depth_metrics': depth_metrics,
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

    def _calculate_nose_metrics_multipoint(self, landmarks: List[Dict]) -> Dict:
        """
        Calculate nose width using multiple measurement points for robustness

        Args:
            landmarks: Full list of facial landmarks

        Returns:
            Dictionary with average width and measurement stability
        """
        widths = []

        # Measurement 1: Ala (widest point) - primary measurement
        left_ala = np.array([
            landmarks[self.NOSE_LANDMARKS['left_ala']]['x'],
            landmarks[self.NOSE_LANDMARKS['left_ala']]['y']
        ])
        right_ala = np.array([
            landmarks[self.NOSE_LANDMARKS['right_ala']]['x'],
            landmarks[self.NOSE_LANDMARKS['right_ala']]['y']
        ])
        ala_width = np.linalg.norm(right_ala - left_ala)
        widths.append(ala_width)

        # Measurement 2: Nostril outer edges
        left_nostril = np.array([
            landmarks[self.NOSE_LANDMARKS['left_nostril']]['x'],
            landmarks[self.NOSE_LANDMARKS['left_nostril']]['y']
        ])
        right_nostril = np.array([
            landmarks[self.NOSE_LANDMARKS['right_nostril']]['x'],
            landmarks[self.NOSE_LANDMARKS['right_nostril']]['y']
        ])
        nostril_width = np.linalg.norm(right_nostril - left_nostril)
        widths.append(nostril_width)

        # Measurement 3: Inner nostrils (bridge area)
        left_inner = np.array([
            landmarks[self.NOSE_LANDMARKS['left_inner_nostril']]['x'],
            landmarks[self.NOSE_LANDMARKS['left_inner_nostril']]['y']
        ])
        right_inner = np.array([
            landmarks[self.NOSE_LANDMARKS['right_inner_nostril']]['x'],
            landmarks[self.NOSE_LANDMARKS['right_inner_nostril']]['y']
        ])
        inner_width = np.linalg.norm(right_inner - left_inner)
        widths.append(inner_width)

        # Calculate statistics
        avg_width = np.mean(widths)
        width_variance = np.std(widths)

        # Measurement stability: inverse of variance (high stability = low variance)
        measurement_stability = 1.0 / (1.0 + width_variance * 5)

        # Calculate nostril flare (how much nostrils flare out from bridge)
        nostril_flare = (ala_width - inner_width) / inner_width if inner_width > 0 else 0

        return {
            'avg_width': float(avg_width),
            'ala_width': float(ala_width),
            'nostril_width': float(nostril_width),
            'measurement_stability': float(measurement_stability),
            'width_variance': float(width_variance),
            'nostril_flare': float(nostril_flare),
            'sample_count': len(widths),
        }

    def _analyze_nose_depth_3d(self, landmarks: List[Dict]) -> Dict:
        """
        Analyze nose projection and prominence using 3D z-coordinates

        Args:
            landmarks: Full list of facial landmarks

        Returns:
            Dictionary with 3D depth metrics
        """
        # Get z-coordinates for key nose points
        nose_tip_z = landmarks[self.NOSE_LANDMARKS['tip']].get('z', 0)
        bridge_top_z = landmarks[self.NOSE_LANDMARKS['bridge_top']].get('z', 0)
        left_ala_z = landmarks[self.NOSE_LANDMARKS['left_ala']].get('z', 0)
        right_ala_z = landmarks[self.NOSE_LANDMARKS['right_ala']].get('z', 0)

        # Get face plane reference (cheeks)
        left_cheek_z = landmarks[self.FACE_LANDMARKS['left_cheek']].get('z', 0)
        right_cheek_z = landmarks[self.FACE_LANDMARKS['right_cheek']].get('z', 0)
        face_plane_z = (left_cheek_z + right_cheek_z) / 2

        # Calculate nose projection (how far nose sticks out from face)
        nose_projection = nose_tip_z - face_plane_z

        # Calculate bridge prominence (height of bridge)
        bridge_prominence = bridge_top_z - face_plane_z

        # Calculate ala depth (average of left and right)
        avg_ala_z = (left_ala_z + right_ala_z) / 2
        ala_projection = avg_ala_z - face_plane_z

        # Classify projection characteristics
        is_prominent = nose_projection > 0.02  # Nose projects forward
        is_flat = nose_projection < -0.01  # Nose is flat/button-like
        has_high_bridge = bridge_prominence > 0.015

        return {
            'nose_projection': float(nose_projection),
            'bridge_prominence': float(bridge_prominence),
            'ala_projection': float(ala_projection),
            'is_prominent': is_prominent,
            'is_flat': is_flat,
            'has_high_bridge': has_high_bridge,
        }

    def _determine_nose_width(
        self,
        ratio: float,
        measurement_stability: float = 1.0,
        depth_metrics: Dict = None
    ) -> Dict:
        """
        Determine nose width category with dynamic confidence calculation

        Args:
            ratio: Nose width to face width ratio
            measurement_stability: Quality score (0-1) based on measurement variance
            depth_metrics: Optional 3D depth analysis results

        Returns:
            Dictionary with category and confidence score
        """
        depth_metrics = depth_metrics or {}

        if ratio < self.THRESHOLDS['narrow_max']:
            category = 'narrow'
            # Dynamic confidence based on distance from threshold
            distance_from_threshold = self.THRESHOLDS['narrow_max'] - ratio
            base_confidence = min(0.95, 0.7 + distance_from_threshold * 4)

        elif ratio <= self.THRESHOLDS['medium_max']:
            category = 'medium'
            # Higher confidence for ratios in middle of range
            mid_point = (self.THRESHOLDS['medium_min'] + self.THRESHOLDS['medium_max']) / 2
            distance_from_mid = abs(ratio - mid_point)
            base_confidence = max(0.65, 0.9 - distance_from_mid * 5)

        else:
            category = 'wide'
            # Dynamic confidence based on distance from threshold
            distance_from_threshold = ratio - self.THRESHOLDS['medium_max']
            base_confidence = min(0.95, 0.7 + distance_from_threshold * 4)

        # Apply measurement quality modifier
        confidence = base_confidence * measurement_stability

        # Boost confidence if 3D metrics confirm the classification
        if depth_metrics:
            # Wide noses often have more nostril flare
            is_prominent = depth_metrics.get('is_prominent', False)
            has_high_bridge = depth_metrics.get('has_high_bridge', False)

            # Adjust confidence based on 3D characteristics
            if category == 'wide' and is_prominent:
                confidence = min(0.95, confidence * 1.1)  # Boost if prominent
            elif category == 'narrow' and has_high_bridge:
                confidence = min(0.95, confidence * 1.05)  # Small boost for high bridge

        return {
            'category': category,
            'confidence': float(confidence)
        }