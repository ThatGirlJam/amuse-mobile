"""
Image Annotator

Draws bounding boxes and labels on facial analysis images
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
from io import BytesIO
from PIL import Image


class ImageAnnotator:
    """Annotate images with bounding boxes and labels"""

    # Color scheme for different features (BGR format for OpenCV)
    COLORS = {
        'face': (0, 255, 255),  # Yellow
        'right_eye': (255, 0, 0),  # Blue
        'left_eye': (255, 0, 0),  # Blue
        'nose': (0, 255, 0),  # Green
        'lips': (0, 0, 255),  # Red
    }

    # Label positions (relative to box)
    LABEL_OFFSET_Y = -10  # pixels above box

    def __init__(
        self,
        box_thickness: int = 2,
        font_scale: float = 0.6,
        font_thickness: int = 2
    ):
        """
        Initialize image annotator

        Args:
            box_thickness: Thickness of bounding box lines
            font_scale: Scale of text labels
            font_thickness: Thickness of text
        """
        self.box_thickness = box_thickness
        self.font_scale = font_scale
        self.font_thickness = font_thickness
        self.font = cv2.FONT_HERSHEY_SIMPLEX

    def annotate_image(
        self,
        image_bytes: bytes,
        bounding_boxes: Dict,
        classifications: Optional[Dict] = None,
        show_labels: bool = True,
        show_confidence: bool = True
    ) -> bytes:
        """
        Annotate image with bounding boxes and labels

        Args:
            image_bytes: Original image as bytes
            bounding_boxes: Dictionary of bounding boxes for each feature
            classifications: Optional dictionary with classification results
            show_labels: Whether to show feature labels
            show_confidence: Whether to show confidence scores

        Returns:
            Annotated image as bytes (PNG format)
        """
        # Convert bytes to OpenCV image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Failed to decode image")

        height, width = img.shape[:2]

        # Draw bounding boxes for each feature
        for feature_name, box in bounding_boxes.items():
            if box.get('width', 0) > 0 and box.get('height', 0) > 0:
                self._draw_box(
                    img,
                    box,
                    width,
                    height,
                    feature_name,
                    classifications,
                    show_labels,
                    show_confidence
                )

        # Convert back to bytes
        success, buffer = cv2.imencode('.png', img)
        if not success:
            raise ValueError("Failed to encode annotated image")

        return buffer.tobytes()

    def _draw_box(
        self,
        img: np.ndarray,
        box: Dict,
        img_width: int,
        img_height: int,
        feature_name: str,
        classifications: Optional[Dict],
        show_labels: bool,
        show_confidence: bool
    ):
        """
        Draw a single bounding box with label

        Args:
            img: OpenCV image array
            box: Bounding box dictionary
            img_width: Image width in pixels
            img_height: Image height in pixels
            feature_name: Name of the feature (for color and label)
            classifications: Classification results
            show_labels: Whether to show labels
            show_confidence: Whether to show confidence
        """
        # Convert to pixel coordinates if normalized
        if box.get('normalized', False):
            x = int(box['x'] * img_width)
            y = int(box['y'] * img_height)
            w = int(box['width'] * img_width)
            h = int(box['height'] * img_height)
        else:
            x = int(box['x'])
            y = int(box['y'])
            w = int(box['width'])
            h = int(box['height'])

        # Get color for this feature
        color = self.COLORS.get(feature_name, (255, 255, 255))

        # Draw rectangle
        cv2.rectangle(img, (x, y), (x + w, y + h), color, self.box_thickness)

        # Draw label if requested
        if show_labels:
            label = self._create_label(
                feature_name,
                classifications,
                show_confidence
            )

            if label:
                # Calculate label position
                label_y = y + self.LABEL_OFFSET_Y
                if label_y < 20:  # If too close to top, put label inside box
                    label_y = y + 20

                # Draw label background for readability
                (text_width, text_height), baseline = cv2.getTextSize(
                    label,
                    self.font,
                    self.font_scale,
                    self.font_thickness
                )
                cv2.rectangle(
                    img,
                    (x, label_y - text_height - baseline),
                    (x + text_width, label_y + baseline),
                    color,
                    -1  # Filled rectangle
                )

                # Draw label text
                cv2.putText(
                    img,
                    label,
                    (x, label_y),
                    self.font,
                    self.font_scale,
                    (255, 255, 255),  # White text
                    self.font_thickness
                )

    def _create_label(
        self,
        feature_name: str,
        classifications: Optional[Dict],
        show_confidence: bool
    ) -> str:
        """
        Create label text for a feature

        Args:
            feature_name: Name of the feature
            classifications: Classification results
            show_confidence: Whether to include confidence score

        Returns:
            Label string
        """
        # Map feature names to classification keys
        classification_map = {
            'right_eye': 'eye_shape',
            'left_eye': 'eye_shape',
            'nose': 'nose_width',
            'lips': 'lip_fullness',
            'face': 'Face'
        }

        label_parts = [feature_name.replace('_', ' ').title()]

        if classifications and feature_name in classification_map:
            class_key = classification_map[feature_name]

            if class_key in classifications:
                class_info = classifications[class_key]

                # Add classification result
                if isinstance(class_info, str):
                    label_parts.append(f": {class_info}")
                elif isinstance(class_info, dict):
                    category = class_info.get('category', class_info.get('eye_shape', ''))
                    if category:
                        label_parts.append(f": {category}")

                    # Add confidence if requested
                    if show_confidence:
                        confidence = class_info.get('confidence', 0)
                        if confidence > 0:
                            label_parts.append(f" ({confidence:.0%})")

        return ''.join(label_parts)

    def draw_landmarks(
        self,
        image_bytes: bytes,
        landmarks: List[Dict],
        landmark_indices: Optional[List[int]] = None,
        color: Tuple[int, int, int] = (0, 255, 0),
        radius: int = 2
    ) -> bytes:
        """
        Draw landmark points on image

        Args:
            image_bytes: Original image as bytes
            landmarks: List of facial landmarks
            landmark_indices: Optional list of specific landmark indices to draw
            color: Color for landmark dots (BGR)
            radius: Radius of landmark dots

        Returns:
            Annotated image as bytes
        """
        # Convert bytes to OpenCV image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Failed to decode image")

        height, width = img.shape[:2]

        # Determine which landmarks to draw
        indices_to_draw = landmark_indices if landmark_indices else range(len(landmarks))

        # Draw each landmark
        for idx in indices_to_draw:
            if idx < len(landmarks):
                landmark = landmarks[idx]
                x = int(landmark['x'] * width)
                y = int(landmark['y'] * height)
                cv2.circle(img, (x, y), radius, color, -1)

        # Convert back to bytes
        success, buffer = cv2.imencode('.png', img)
        if not success:
            raise ValueError("Failed to encode annotated image")

        return buffer.tobytes()

    def create_side_by_side(
        self,
        original_bytes: bytes,
        annotated_bytes: bytes
    ) -> bytes:
        """
        Create side-by-side comparison image

        Args:
            original_bytes: Original image bytes
            annotated_bytes: Annotated image bytes

        Returns:
            Combined image as bytes
        """
        # Load images
        orig_img = cv2.imdecode(np.frombuffer(original_bytes, np.uint8), cv2.IMREAD_COLOR)
        annot_img = cv2.imdecode(np.frombuffer(annotated_bytes, np.uint8), cv2.IMREAD_COLOR)

        if orig_img is None or annot_img is None:
            raise ValueError("Failed to decode images")

        # Resize to same height if needed
        if orig_img.shape[0] != annot_img.shape[0]:
            target_height = min(orig_img.shape[0], annot_img.shape[0])
            orig_img = cv2.resize(orig_img, (
                int(orig_img.shape[1] * target_height / orig_img.shape[0]),
                target_height
            ))
            annot_img = cv2.resize(annot_img, (
                int(annot_img.shape[1] * target_height / annot_img.shape[0]),
                target_height
            ))

        # Concatenate horizontally
        combined = np.hstack([orig_img, annot_img])

        # Convert to bytes
        success, buffer = cv2.imencode('.png', combined)
        if not success:
            raise ValueError("Failed to encode combined image")

        return buffer.tobytes()
