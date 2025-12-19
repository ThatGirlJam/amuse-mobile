"""
Bounding Box Calculator

Calculates bounding boxes for facial features from MediaPipe landmarks
"""

import numpy as np
from typing import List, Dict, Tuple


class BoundingBoxCalculator:
    """Calculate bounding boxes for facial features"""

    # Landmark indices for each feature (from classifiers)
    RIGHT_EYE_LANDMARKS = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
    LEFT_EYE_LANDMARKS = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]

    NOSE_LANDMARKS = [1, 98, 327, 129, 358, 168, 219, 439, 2, 94, 19, 1, 4, 5, 195, 197]

    LIP_LANDMARKS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 185, 40, 39, 37, 0, 267, 269, 270, 409]

    # Face contour landmarks for overall face box
    FACE_CONTOUR_LANDMARKS = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
    ]

    def __init__(self, padding_percent: float = 0.1):
        """
        Initialize bounding box calculator

        Args:
            padding_percent: Percentage of box size to add as padding (0.1 = 10%)
        """
        self.padding_percent = padding_percent

    def calculate_all_boxes(
        self,
        landmarks: List[Dict],
        image_width: int,
        image_height: int,
        normalize: bool = True
    ) -> Dict:
        """
        Calculate bounding boxes for all facial features

        Args:
            landmarks: List of facial landmarks with x, y coordinates
            image_width: Width of image in pixels
            image_height: Height of image in pixels
            normalize: If True, return coordinates normalized to 0-1 range

        Returns:
            Dictionary with bounding boxes for each feature
        """
        boxes = {}

        # Calculate box for each feature
        boxes['face'] = self._calculate_box(
            landmarks, self.FACE_CONTOUR_LANDMARKS, image_width, image_height, normalize
        )
        boxes['right_eye'] = self._calculate_box(
            landmarks, self.RIGHT_EYE_LANDMARKS, image_width, image_height, normalize
        )
        boxes['left_eye'] = self._calculate_box(
            landmarks, self.LEFT_EYE_LANDMARKS, image_width, image_height, normalize
        )
        boxes['nose'] = self._calculate_box(
            landmarks, self.NOSE_LANDMARKS, image_width, image_height, normalize
        )
        boxes['lips'] = self._calculate_box(
            landmarks, self.LIP_LANDMARKS, image_width, image_height, normalize
        )

        return boxes

    def _calculate_box(
        self,
        landmarks: List[Dict],
        landmark_indices: List[int],
        image_width: int,
        image_height: int,
        normalize: bool = True
    ) -> Dict:
        """
        Calculate bounding box for a set of landmarks

        Args:
            landmarks: Full list of facial landmarks
            landmark_indices: Indices of landmarks to include in box
            image_width: Image width in pixels
            image_height: Image height in pixels
            normalize: If True, return normalized coordinates (0-1)

        Returns:
            Dictionary with box coordinates {x, y, width, height}
        """
        # Extract x, y coordinates for specified landmarks
        xs = [landmarks[idx]['x'] for idx in landmark_indices if idx < len(landmarks)]
        ys = [landmarks[idx]['y'] for idx in landmark_indices if idx < len(landmarks)]

        if not xs or not ys:
            return {'x': 0, 'y': 0, 'width': 0, 'height': 0, 'normalized': normalize}

        # Find bounding box
        min_x = min(xs)
        max_x = max(xs)
        min_y = min(ys)
        max_y = max(ys)

        # Calculate box dimensions
        width = max_x - min_x
        height = max_y - min_y

        # Add padding
        padding_x = width * self.padding_percent
        padding_y = height * self.padding_percent

        min_x = max(0, min_x - padding_x)
        min_y = max(0, min_y - padding_y)
        width = min(1.0 if normalize else image_width, width + 2 * padding_x)
        height = min(1.0 if normalize else image_height, height + 2 * padding_y)

        # Convert to pixel coordinates if not normalizing
        if not normalize:
            min_x = int(min_x * image_width)
            min_y = int(min_y * image_height)
            width = int(width * image_width)
            height = int(height * image_height)

        return {
            'x': float(min_x),
            'y': float(min_y),
            'width': float(width),
            'height': float(height),
            'normalized': normalize
        }

    def convert_to_pixel_coords(
        self,
        box: Dict,
        image_width: int,
        image_height: int
    ) -> Dict:
        """
        Convert normalized bounding box to pixel coordinates

        Args:
            box: Bounding box with normalized coordinates
            image_width: Image width in pixels
            image_height: Image height in pixels

        Returns:
            Bounding box with pixel coordinates
        """
        if not box.get('normalized', False):
            return box  # Already in pixel coordinates

        return {
            'x': int(box['x'] * image_width),
            'y': int(box['y'] * image_height),
            'width': int(box['width'] * image_width),
            'height': int(box['height'] * image_height),
            'normalized': False
        }

    def get_box_center(self, box: Dict) -> Tuple[float, float]:
        """
        Get center point of bounding box

        Args:
            box: Bounding box dictionary

        Returns:
            Tuple of (center_x, center_y)
        """
        center_x = box['x'] + box['width'] / 2
        center_y = box['y'] + box['height'] / 2
        return (center_x, center_y)

    def get_box_corners(self, box: Dict) -> List[Tuple[float, float]]:
        """
        Get all four corners of bounding box

        Args:
            box: Bounding box dictionary

        Returns:
            List of (x, y) tuples for [top_left, top_right, bottom_right, bottom_left]
        """
        x, y, w, h = box['x'], box['y'], box['width'], box['height']
        return [
            (x, y),  # top-left
            (x + w, y),  # top-right
            (x + w, y + h),  # bottom-right
            (x, y + h)  # bottom-left
        ]
