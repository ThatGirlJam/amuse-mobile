"""
Image and Face Quality Validator

Validates image quality, head pose, and facial expression
to ensure accurate feature analysis.
"""

import numpy as np
import math
from typing import Dict, List, Tuple, Optional


class QualityValidator:
    """Validates image and face quality for accurate analysis"""

    # Thresholds for quality checks
    MAX_HEAD_ROTATION_DEGREES = 15  # Maximum acceptable head rotation
    MIN_LANDMARK_CONFIDENCE = 0.5   # Minimum MediaPipe confidence
    MAX_EXPRESSION_THRESHOLD = 0.15  # Maximum mouth opening for neutral expression

    def __init__(self):
        """Initialize quality validator"""
        pass

    def validate_all(
        self,
        landmarks: List[Dict],
        image_width: int,
        image_height: int,
        landmark_confidences: Optional[List[float]] = None
    ) -> Dict:
        """
        Run all quality checks

        Args:
            landmarks: List of facial landmarks with x, y, z coordinates
            image_width: Width of the image in pixels
            image_height: Height of the image in pixels
            landmark_confidences: Optional list of confidence scores for each landmark

        Returns:
            Dictionary with quality metrics and warnings
        """
        warnings = []
        quality_scores = {}

        # Check head pose
        pose_result = self.check_head_pose(landmarks, image_width, image_height)
        quality_scores['head_pose'] = pose_result
        if not pose_result['is_frontal']:
            warnings.append(f"Head is rotated {pose_result['rotation_degrees']:.1f}° from frontal view")

        # Check facial expression
        expression_result = self.check_facial_expression(landmarks)
        quality_scores['expression'] = expression_result
        if not expression_result['is_neutral']:
            warnings.append(f"Non-neutral facial expression detected: {expression_result['expression_type']}")

        # Check landmark quality
        if landmark_confidences:
            confidence_result = self.check_landmark_confidence(landmark_confidences)
            quality_scores['landmark_confidence'] = confidence_result
            if confidence_result['low_confidence_count'] > 0:
                warnings.append(
                    f"{confidence_result['low_confidence_count']} landmarks have low confidence"
                )

        # Calculate overall quality score (0-1)
        overall_quality = self._calculate_overall_quality(quality_scores)

        return {
            'quality_score': overall_quality,
            'quality_details': quality_scores,
            'warnings': warnings,
            'is_acceptable': overall_quality >= 0.6 and len(warnings) <= 2
        }

    def check_head_pose(
        self,
        landmarks: List[Dict],
        image_width: int,
        image_height: int
    ) -> Dict:
        """
        Check if head is in frontal pose

        Uses nose tip, chin, and forehead to estimate head rotation

        Args:
            landmarks: List of facial landmarks
            image_width: Image width in pixels
            image_height: Image height in pixels

        Returns:
            Dictionary with pose information
        """
        # Key landmarks for pose estimation
        nose_tip = landmarks[1]  # Nose tip
        chin = landmarks[152]  # Chin
        forehead = landmarks[10]  # Forehead center
        left_cheek = landmarks[234]  # Left face boundary
        right_cheek = landmarks[454]  # Right face boundary

        # Calculate face centerline (should be vertical for frontal view)
        centerline_dx = nose_tip['x'] - forehead['x']
        centerline_dy = nose_tip['y'] - forehead['y']

        # Calculate rotation angle from vertical
        rotation_radians = math.atan2(centerline_dx, centerline_dy)
        rotation_degrees = abs(math.degrees(rotation_radians))

        # Check face symmetry (left vs right side)
        face_center_x = (left_cheek['x'] + right_cheek['x']) / 2
        nose_offset = abs(nose_tip['x'] - face_center_x) * image_width
        face_width = abs(right_cheek['x'] - left_cheek['x']) * image_width
        asymmetry_ratio = nose_offset / face_width if face_width > 0 else 0

        # Check depth variation (z-coordinate) for 3D rotation
        left_cheek_z = left_cheek.get('z', 0)
        right_cheek_z = right_cheek.get('z', 0)
        depth_asymmetry = abs(left_cheek_z - right_cheek_z)

        is_frontal = (
            rotation_degrees < self.MAX_HEAD_ROTATION_DEGREES and
            asymmetry_ratio < 0.15 and  # Nose should be centered
            depth_asymmetry < 0.05  # Face should be flat (not turned)
        )

        return {
            'is_frontal': is_frontal,
            'rotation_degrees': rotation_degrees,
            'asymmetry_ratio': asymmetry_ratio,
            'depth_asymmetry': depth_asymmetry,
            'pose_quality': 1.0 - (rotation_degrees / 90)  # 0-1 score
        }

    def check_facial_expression(self, landmarks: List[Dict]) -> Dict:
        """
        Check if face has neutral expression

        Detects smiling, mouth opening, and eyebrow raising

        Args:
            landmarks: List of facial landmarks

        Returns:
            Dictionary with expression information
        """
        # Mouth opening detection
        upper_lip_center = landmarks[13]  # Upper lip center
        lower_lip_center = landmarks[14]  # Lower lip center
        mouth_left = landmarks[61]  # Left mouth corner
        mouth_right = landmarks[291]  # Right mouth corner

        mouth_height = abs(upper_lip_center['y'] - lower_lip_center['y'])
        mouth_width = abs(mouth_left['x'] - mouth_right['x'])
        mouth_aspect_ratio = mouth_height / mouth_width if mouth_width > 0 else 0

        # Smile detection (mouth corners raised)
        lip_line_y = (upper_lip_center['y'] + lower_lip_center['y']) / 2
        left_corner_raised = mouth_left['y'] < lip_line_y
        right_corner_raised = mouth_right['y'] < lip_line_y
        is_smiling = left_corner_raised and right_corner_raised

        # Eyebrow raising detection
        left_eyebrow_center = landmarks[55]  # Left eyebrow
        right_eyebrow_center = landmarks[285]  # Right eyebrow
        left_eye_top = landmarks[159]  # Left eye top
        right_eye_top = landmarks[386]  # Right eye top

        left_brow_distance = abs(left_eyebrow_center['y'] - left_eye_top['y'])
        right_brow_distance = abs(right_eyebrow_center['y'] - right_eye_top['y'])
        avg_brow_distance = (left_brow_distance + right_brow_distance) / 2

        # Determine expression type
        expression_type = "neutral"
        if mouth_aspect_ratio > self.MAX_EXPRESSION_THRESHOLD:
            expression_type = "mouth_open"
        elif is_smiling:
            expression_type = "smiling"
        elif avg_brow_distance > 0.08:  # Threshold for raised eyebrows
            expression_type = "eyebrows_raised"

        is_neutral = expression_type == "neutral"

        return {
            'is_neutral': is_neutral,
            'expression_type': expression_type,
            'mouth_aspect_ratio': mouth_aspect_ratio,
            'is_smiling': is_smiling,
            'eyebrow_distance': avg_brow_distance,
            'expression_confidence': 1.0 if is_neutral else 0.5
        }

    def check_landmark_confidence(
        self,
        confidences: List[float]
    ) -> Dict:
        """
        Check quality of landmark detection

        Args:
            confidences: List of confidence scores (0-1) for each landmark

        Returns:
            Dictionary with confidence statistics
        """
        if not confidences:
            return {
                'average_confidence': 1.0,
                'min_confidence': 1.0,
                'low_confidence_count': 0,
                'confidence_quality': 1.0
            }

        avg_confidence = np.mean(confidences)
        min_confidence = np.min(confidences)
        low_confidence_count = sum(1 for c in confidences if c < self.MIN_LANDMARK_CONFIDENCE)

        # Quality score based on how many landmarks are reliable
        confidence_quality = 1.0 - (low_confidence_count / len(confidences))

        return {
            'average_confidence': float(avg_confidence),
            'min_confidence': float(min_confidence),
            'low_confidence_count': low_confidence_count,
            'confidence_quality': confidence_quality
        }

    def _calculate_overall_quality(self, quality_scores: Dict) -> float:
        """
        Calculate overall quality score from individual checks

        Args:
            quality_scores: Dictionary with individual quality metrics

        Returns:
            Overall quality score (0-1)
        """
        scores = []

        if 'head_pose' in quality_scores:
            scores.append(quality_scores['head_pose']['pose_quality'])

        if 'expression' in quality_scores:
            scores.append(quality_scores['expression']['expression_confidence'])

        if 'landmark_confidence' in quality_scores:
            scores.append(quality_scores['landmark_confidence']['confidence_quality'])

        return np.mean(scores) if scores else 1.0

    def get_quality_recommendations(self, validation_result: Dict) -> List[str]:
        """
        Get user-friendly recommendations based on quality issues

        Args:
            validation_result: Result from validate_all()

        Returns:
            List of recommendation strings
        """
        recommendations = []

        warnings = validation_result.get('warnings', [])
        quality_details = validation_result.get('quality_details', {})

        # Head pose recommendations
        if 'head_pose' in quality_details and not quality_details['head_pose']['is_frontal']:
            recommendations.append("Please face the camera directly with your head centered")

        # Expression recommendations
        if 'expression' in quality_details:
            expr_type = quality_details['expression']['expression_type']
            if expr_type == "smiling":
                recommendations.append("Please maintain a neutral expression without smiling")
            elif expr_type == "mouth_open":
                recommendations.append("Please close your mouth for the photo")
            elif expr_type == "eyebrows_raised":
                recommendations.append("Please relax your eyebrows to a natural position")

        # Confidence recommendations
        if 'landmark_confidence' in quality_details:
            if quality_details['landmark_confidence']['low_confidence_count'] > 50:
                recommendations.append("Image quality may be poor - try better lighting or a clearer photo")

        if not recommendations:
            recommendations.append("Image quality is good - ready for analysis!")

        return recommendations
