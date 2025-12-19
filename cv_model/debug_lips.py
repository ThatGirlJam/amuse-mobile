"""Debug lip landmarks to see what's being measured"""
import sys
import os
import cv2
import numpy as np

sys.path.insert(0, 'app')
from app.utils.face_analyzer import FaceAnalyzer

image_path = sys.argv[1] if len(sys.argv) > 1 else '/Users/desirees/Downloads/woman2.jpeg'

# Load and analyze
with open(image_path, 'rb') as f:
    image_bytes = f.read()

nparr = np.frombuffer(image_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
height, width = img.shape[:2]

analyzer = FaceAnalyzer()
result = analyzer.analyze_image(image_bytes)

if not result.get('face_detected'):
    print(f"Error: {result.get('error')}")
    sys.exit(1)

landmarks = result['landmarks']

# Lip landmarks
upper_top = 37
upper_bottom = 13
lower_top = 14
lower_bottom = 17
left_corner = 61
right_corner = 291

def draw_landmark(img, lm_idx, color, label):
    lm = landmarks[lm_idx]
    x, y = int(lm['x'] * width), int(lm['y'] * height)
    cv2.circle(img, (x, y), 8, color, -1)
    cv2.putText(img, f"{label}({lm_idx})", (x+10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return (x, y)

# Draw landmarks
upper_top_pt = draw_landmark(img, upper_top, (0, 255, 0), "UpperTop")  # Green
upper_bottom_pt = draw_landmark(img, upper_bottom, (0, 255, 255), "UpperBottom")  # Yellow
lower_top_pt = draw_landmark(img, lower_top, (255, 255, 0), "LowerTop")  # Cyan
lower_bottom_pt = draw_landmark(img, lower_bottom, (0, 0, 255), "LowerBottom")  # Red
left_pt = draw_landmark(img, left_corner, (255, 0, 255), "Left")  # Magenta
right_pt = draw_landmark(img, right_corner, (255, 0, 255), "Right")  # Magenta

# Draw lines showing measurements
cv2.line(img, upper_top_pt, upper_bottom_pt, (0, 255, 0), 2)  # Upper lip
cv2.line(img, lower_top_pt, lower_bottom_pt, (0, 0, 255), 2)  # Lower lip
cv2.line(img, left_pt, right_pt, (255, 0, 255), 2)  # Width

# Show measurements
measurements = result['lip_analysis']['measurements']
cv2.putText(img, f"Upper: {measurements['upper_lip_thickness']:.4f}", (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
cv2.putText(img, f"Lower: {measurements['lower_lip_thickness']:.4f}", (10, 60),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
cv2.putText(img, f"Total: {measurements['total_lip_height']:.4f}", (10, 90),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
cv2.putText(img, f"Width: {measurements['mouth_width']:.4f}", (10, 120),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
cv2.putText(img, f"Ratio: {measurements['lip_height_to_width_ratio']:.4f}", (10, 150),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

cv2.imwrite('debug_lips.jpg', img)
print("Saved debug_lips.jpg - check if landmarks are correct!")
print(f"\nLandmark 37 (upper top) at y={landmarks[upper_top]['y']:.4f}")
print(f"Landmark 13 (upper bottom) at y={landmarks[upper_bottom]['y']:.4f}")
print(f"Landmark 17 (lower bottom) at y={landmarks[lower_bottom]['y']:.4f}")
