"""
Debug script to visualize landmarks and see what's wrong
"""

import sys
import os
import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.utils.face_analyzer import FaceAnalyzer

def visualize_eye_landmarks(image_path):
    """Visualize eye landmarks to debug angle calculation"""

    # Load image
    with open(image_path, 'rb') as f:
        image_bytes = f.read()

    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    height, width = img.shape[:2]

    # Analyze
    analyzer = FaceAnalyzer()
    result = analyzer.analyze_image(image_bytes)

    if not result.get('face_detected'):
        print(f"No face detected: {result.get('error')}")
        return

    landmarks = result['landmarks']

    # Draw key eye landmarks
    # Right eye
    right_inner = 133
    right_outer = 33

    # Left eye
    left_inner = 362
    left_outer = 263

    # Convert normalized coordinates to pixels
    def to_pixel(landmark_idx):
        lm = landmarks[landmark_idx]
        x = int(lm['x'] * width)
        y = int(lm['y'] * height)
        return (x, y)

    # Draw right eye corners
    r_inner_pt = to_pixel(right_inner)
    r_outer_pt = to_pixel(right_outer)

    cv2.circle(img, r_inner_pt, 5, (0, 255, 0), -1)  # Green = inner
    cv2.circle(img, r_outer_pt, 5, (0, 0, 255), -1)  # Red = outer
    cv2.line(img, r_inner_pt, r_outer_pt, (255, 255, 0), 2)  # Cyan line

    # Draw left eye corners
    l_inner_pt = to_pixel(left_inner)
    l_outer_pt = to_pixel(left_outer)

    cv2.circle(img, l_inner_pt, 5, (0, 255, 0), -1)  # Green = inner
    cv2.circle(img, l_outer_pt, 5, (0, 0, 255), -1)  # Red = outer
    cv2.line(img, l_inner_pt, l_outer_pt, (255, 255, 0), 2)  # Cyan line

    # Calculate angles
    right_dx = landmarks[right_outer]['x'] - landmarks[right_inner]['x']
    right_dy = landmarks[right_outer]['y'] - landmarks[right_inner]['y']
    right_angle = np.degrees(np.arctan2(-right_dy, right_dx))

    left_dx = landmarks[left_outer]['x'] - landmarks[left_inner]['x']
    left_dy = landmarks[left_outer]['y'] - landmarks[left_inner]['y']
    left_angle = np.degrees(np.arctan2(-left_dy, left_dx))

    # Print debug info
    print(f"\nRIGHT EYE:")
    print(f"  Inner (133): x={landmarks[right_inner]['x']:.3f}, y={landmarks[right_inner]['y']:.3f}")
    print(f"  Outer (33):  x={landmarks[right_outer]['x']:.3f}, y={landmarks[right_outer]['y']:.3f}")
    print(f"  dx={right_dx:.3f}, dy={right_dy:.3f}")
    print(f"  Angle: {right_angle:.2f}°")

    print(f"\nLEFT EYE:")
    print(f"  Inner (362): x={landmarks[left_inner]['x']:.3f}, y={landmarks[left_inner]['y']:.3f}")
    print(f"  Outer (263): x={landmarks[left_outer]['x']:.3f}, y={landmarks[left_outer]['y']:.3f}")
    print(f"  dx={left_dx:.3f}, dy={left_dy:.3f}")
    print(f"  Angle: {left_angle:.2f}°")

    print(f"\nEye Analysis Result:")
    print(f"  Primary Shape: {result['eye_analysis']['eye_shape']}")
    print(f"  Corner Angle: {result['eye_analysis']['details']['corner_angle']:.2f}°")
    print(f"  Aspect Ratio: {result['eye_analysis']['details']['aspect_ratio']:.4f}")

    # Add text annotations
    cv2.putText(img, "GREEN=Inner, RED=Outer", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(img, f"Right Angle: {right_angle:.1f}°", (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(img, f"Left Angle: {left_angle:.1f}°", (10, 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Save debug image
    output_path = 'debug_landmarks.jpg'
    cv2.imwrite(output_path, img)
    print(f"\nDebug image saved to: {output_path}")
    print(f"Check the image to see if landmarks are correct!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python debug_landmarks.py <image_path>")
        sys.exit(1)

    visualize_eye_landmarks(sys.argv[1])
