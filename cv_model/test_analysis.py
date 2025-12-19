"""
Test Facial Analysis Script

Usage:
    python test_analysis.py <path_to_image>
    python test_analysis.py <path_to_image> --save-annotated output.png

This script will:
1. Load your image
2. Run the improved facial analysis
3. Display all results with new 3D metrics
4. Optionally save the annotated image with bounding boxes
"""

import sys
import os
from pathlib import Path

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.utils.face_analyzer import FaceAnalyzer
import json


def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_quality_results(quality_check):
    """Print quality validation results"""
    print_section("IMAGE QUALITY CHECK")

    score = quality_check.get('quality_score', 0)
    is_acceptable = quality_check.get('is_acceptable', False)
    warnings = quality_check.get('warnings', [])

    print(f"Overall Quality Score: {score:.2f}/1.00")
    print(f"Acceptable for Analysis: {'✓ YES' if is_acceptable else '✗ NO'}")

    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for i, warning in enumerate(warnings, 1):
            print(f"  {i}. {warning}")
    else:
        print("\n✓ No quality issues detected!")

    # Show detailed metrics
    details = quality_check.get('quality_details', {})

    if 'head_pose' in details:
        pose = details['head_pose']
        print(f"\nHead Pose:")
        print(f"  - Frontal: {'✓ YES' if pose['is_frontal'] else '✗ NO'}")
        print(f"  - Rotation: {pose['rotation_degrees']:.1f}°")
        print(f"  - Asymmetry: {pose['asymmetry_ratio']:.3f}")

    if 'expression' in details:
        expr = details['expression']
        print(f"\nFacial Expression:")
        print(f"  - Type: {expr['expression_type']}")
        print(f"  - Neutral: {'✓ YES' if expr['is_neutral'] else '✗ NO'}")


def print_eye_results(eye_analysis):
    """Print eye shape analysis results"""
    print_section("EYE SHAPE ANALYSIS")

    eye_shape = eye_analysis.get('eye_shape', 'unknown')
    confidence = eye_analysis.get('confidence', 0)
    secondary = eye_analysis.get('secondary_features', [])

    print(f"Classification: {eye_shape.upper()}")
    if secondary:
        print(f"Secondary Features: {', '.join(secondary)}")
    print(f"Confidence: {confidence:.1%} (dynamic)")

    details = eye_analysis.get('details', {})

    # Show measurements
    if 'aspect_ratio' in details:
        print(f"\nMeasurements:")
        print(f"  - Aspect Ratio: {details['aspect_ratio']:.4f}")
        print(f"  - Eyelid Coverage: {details.get('eyelid_coverage', 0):.4f}")
        print(f"  - Corner Angle: {details.get('corner_angle', 0):.2f}°")

    # Show 3D depth metrics
    if 'depth_metrics' in details:
        depth = details['depth_metrics']
        if depth:
            print(f"\n3D Depth Analysis:")
            print(f"  - Eyelid Depth Diff: {depth.get('eyelid_depth_diff', 0):.4f}")
            print(f"  - Is Deep Set: {depth.get('is_deep_set', False)}")
            print(f"  - Is Prominent: {depth.get('is_prominent', False)}")

    # Show measurement quality
    if 'measurement_quality' in details:
        quality = details['measurement_quality']
        # measurement_quality is a float, not a dict
        print(f"\nMeasurement Quality: {quality:.2f}")


def print_nose_results(nose_analysis):
    """Print nose width analysis results"""
    print_section("NOSE WIDTH ANALYSIS")

    category = nose_analysis.get('nose_width', nose_analysis.get('category', 'unknown'))
    confidence = nose_analysis.get('confidence', 0)

    print(f"Classification: {category.upper()}")
    print(f"Confidence: {confidence:.1%} (dynamic)")

    details = nose_analysis.get('details', {})

    # Show measurements
    if 'nose_width_ratio' in details:
        print(f"\nMeasurements:")
        print(f"  - Width Ratio: {details['nose_width_ratio']:.4f}")
        measurements = nose_analysis.get('measurements', {})
        if measurements:
            print(f"  - Ala Width: {measurements.get('ala_width', 0):.4f}")
            print(f"  - Nostril Width: {measurements.get('nostril_width', 0):.4f}")

    # Show 3D projection
    if 'nose_projection' in details:
        print(f"\n3D Projection:")
        print(f"  - Prominence: {details['nose_projection']:.4f}")
        print(f"  - Bridge Height: {details.get('bridge_height', 0):.4f}")

    # Show nostril flare
    if 'nostril_flare' in details:
        print(f"\nNostril Analysis:")
        print(f"  - Flare Ratio: {details['nostril_flare']:.4f}")


def print_lip_results(lip_analysis):
    """Print lip fullness analysis results"""
    print_section("LIP FULLNESS ANALYSIS")

    category = lip_analysis.get('lip_fullness', lip_analysis.get('category', 'unknown'))
    confidence = lip_analysis.get('confidence', 0)

    print(f"Classification: {category.upper()}")
    print(f"Confidence: {confidence:.1%} (dynamic)")

    details = lip_analysis.get('details', {})

    # Show measurements
    if 'lip_height_to_width_ratio' in details:
        print(f"\nMeasurements:")
        print(f"  - Height to Width Ratio: {details['lip_height_to_width_ratio']:.4f}")
        measurements = lip_analysis.get('measurements', {})
        if measurements:
            print(f"  - Upper Lip Thickness: {measurements.get('upper_lip_thickness', 0):.4f}")
            print(f"  - Lower Lip Thickness: {measurements.get('lower_lip_thickness', 0):.4f}")

    # Show lip balance
    if 'lip_balance' in details:
        print(f"\nLip Balance: {details['lip_balance'].replace('_', ' ').title()}")

    # Show 3D volume
    if 'lip_projection' in details:
        print(f"\n3D Volume Analysis:")
        print(f"  - Projection: {details['lip_projection']:.4f}")
        measurements = lip_analysis.get('measurements', {})
        if measurements and 'depth_metrics' in measurements:
            depth = measurements['depth_metrics']
            print(f"  - Upper Projection: {depth.get('upper_projection', 0):.4f}")
            print(f"  - Lower Projection: {depth.get('lower_projection', 0):.4f}")


def print_bounding_boxes(bounding_boxes):
    """Print bounding box coordinates"""
    print_section("BOUNDING BOXES")

    for feature, box in bounding_boxes.items():
        print(f"\n{feature.replace('_', ' ').title()}:")
        print(f"  - Position: ({box['x']:.3f}, {box['y']:.3f})")
        print(f"  - Size: {box['width']:.3f} × {box['height']:.3f}")
        print(f"  - Normalized: {box.get('normalized', True)}")


def main():
    """Main test function"""
    if len(sys.argv) < 2:
        print("Usage: python test_analysis.py <path_to_image> [--save-annotated output.png]")
        print("\nExample:")
        print("  python test_analysis.py my_photo.jpg")
        print("  python test_analysis.py my_photo.jpg --save-annotated annotated_output.png")
        sys.exit(1)

    image_path = sys.argv[1]

    # Check for save annotated flag
    save_annotated = False
    output_path = "annotated_output.png"
    if len(sys.argv) >= 4 and sys.argv[2] == "--save-annotated":
        save_annotated = True
        output_path = sys.argv[3]

    # Check if image exists
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("  FACIAL ANALYSIS TEST")
    print("=" * 60)
    print(f"\nImage: {image_path}")
    print("Loading and analyzing...")

    try:
        # Load image
        with open(image_path, 'rb') as f:
            image_bytes = f.read()

        # Run analysis
        analyzer = FaceAnalyzer()
        result = analyzer.analyze_image(image_bytes)

        # Check for errors
        if 'error' in result:
            print(f"\n❌ Error: {result['error']}")
            if 'message' in result:
                print(f"Message: {result['message']}")
            sys.exit(1)

        # Print all results
        print_quality_results(result.get('quality_check', {}))
        print_eye_results(result.get('eye_analysis', {}))
        print_nose_results(result.get('nose_analysis', {}))
        print_lip_results(result.get('lip_analysis', {}))
        print_bounding_boxes(result.get('bounding_boxes', {}))

        # Save annotated image if requested
        if save_annotated:
            annotated_bytes = result.get('annotated_image_bytes')
            if annotated_bytes:
                with open(output_path, 'wb') as f:
                    f.write(annotated_bytes)
                print_section("ANNOTATED IMAGE")
                print(f"✓ Saved annotated image to: {output_path}")
            else:
                print("\n⚠ Warning: No annotated image available")

        print("\n" + "=" * 60)
        print("  ANALYSIS COMPLETE")
        print("=" * 60)
        print()

    except Exception as e:
        print(f"\n❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
