"""
Quick test script - Shows just the classifications
"""
import sys
sys.path.insert(0, 'app')

from app.utils.face_analyzer import FaceAnalyzer

if len(sys.argv) < 2:
    print("Usage: python quick_test.py image.jpg")
    sys.exit(1)

image_path = sys.argv[1]

with open(image_path, 'rb') as f:
    image_bytes = f.read()

analyzer = FaceAnalyzer()
result = analyzer.analyze_image(image_bytes)

if result.get('face_detected'):
    print(f"\n✓ Image: {image_path}")
    print(f"\nEye Shape: {result['eye_analysis']['eye_shape']}")
    print(f"  - Aspect Ratio: {result['eye_analysis']['details']['aspect_ratio']:.4f}")
    print(f"  - Corner Tilt: {result['eye_analysis']['details']['corner_angle']:.2f}")

    print(f"\nNose Width: {result['nose_analysis']['nose_width']}")
    print(f"  - Ratio: {result['nose_analysis']['details']['nose_to_face_ratio']:.4f}")

    lip_measurements = result['lip_analysis']['measurements']
    print(f"\nLip Fullness: {result['lip_analysis']['lip_fullness']}")
    print(f"  - Ratio: {result['lip_analysis']['details']['lip_height_to_width_ratio']:.4f}")
    print(f"  - Upper thickness: {lip_measurements.get('upper_lip_thickness', 0):.4f}")
    print(f"  - Lower thickness: {lip_measurements.get('lower_lip_thickness', 0):.4f}")
    print(f"  - Total height: {lip_measurements.get('total_lip_height', 0):.4f}")
    print(f"  - Mouth width: {lip_measurements.get('mouth_width', 0):.4f}")
    print(f"  - Threshold: thin<0.08, medium=0.08-0.14, full>0.14")
else:
    print(f"✗ Error: {result.get('error')}")
