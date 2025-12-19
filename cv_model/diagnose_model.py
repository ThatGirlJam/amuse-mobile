"""
Diagnostic Script for Facial Analysis Model

This script helps identify why the model might be giving the same results
for different images. It prints detailed measurements and threshold comparisons.

Usage:
    python diagnose_model.py <image1> <image2> <image3> ...
"""

import sys
import os
from pathlib import Path
from typing import List, Dict
import json

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.utils.face_analyzer import FaceAnalyzer
from app.utils.eye_classifier import EyeClassifier
from app.utils.nose_classifier import NoseClassifier
from app.utils.lip_classifier import LipClassifier


def print_separator(char="=", length=80):
    """Print a separator line"""
    print(char * length)


def print_header(title):
    """Print a section header"""
    print_separator()
    print(f"  {title}")
    print_separator()


def print_raw_measurements(analysis: Dict, image_path: str):
    """Print detailed raw measurements from analysis"""
    print_header(f"RAW MEASUREMENTS: {Path(image_path).name}")

    # Eye measurements
    print("\n[EYE ANALYSIS]")
    eye_data = analysis.get('eye_analysis', {})
    eye_details = eye_data.get('details', {})
    eye_metrics = eye_data.get('metrics', {})

    print(f"Primary Shape: {eye_data.get('eye_shape', 'N/A')}")
    print(f"Secondary Features: {eye_data.get('secondary_features', [])}")
    print(f"Overall Confidence: {eye_data.get('confidence', 0):.4f}")

    print("\nMeasurements:")
    print(f"  Aspect Ratio: {eye_details.get('aspect_ratio', 0):.6f}")
    print(f"  Eyelid Coverage: {eye_details.get('eyelid_coverage', 0):.6f}")
    print(f"  Corner Angle: {eye_details.get('corner_angle', 0):.4f}°")
    print(f"  Measurement Quality: {eye_details.get('measurement_quality', 0):.4f}")

    print("\nThreshold Comparison:")
    aspect = eye_details.get('aspect_ratio', 0)
    eyelid = eye_details.get('eyelid_coverage', 0)
    angle = eye_details.get('corner_angle', 0)

    thresholds = EyeClassifier.THRESHOLDS
    print(f"  Aspect Ratio {aspect:.4f}:")
    print(f"    - Almond range: {thresholds['aspect_ratio']['almond_min']:.2f} - {thresholds['aspect_ratio']['almond_max']:.2f}")
    print(f"    - Round min: {thresholds['aspect_ratio']['round_min']:.2f}")

    print(f"  Eyelid Coverage {eyelid:.4f}:")
    print(f"    - Monolid max: {thresholds['eyelid_coverage']['monolid_max']:.2f}")
    print(f"    - Hooded max: {thresholds['eyelid_coverage']['hooded_max']:.2f}")

    print(f"  Corner Angle {angle:.2f}°:")
    print(f"    - Upturned min: {thresholds['corner_angle']['upturned_min']:.2f}°")
    print(f"    - Downturned max: {thresholds['corner_angle']['downturned_max']:.2f}°")

    # 3D depth metrics
    depth_metrics = eye_details.get('depth_metrics', {})
    if depth_metrics:
        print("\n3D Depth Analysis:")
        print(f"  Eyelid Depth Diff: {depth_metrics.get('eyelid_depth_diff', 0):.6f}")
        print(f"  Is Deep Set: {depth_metrics.get('is_deep_set', False)}")
        print(f"  Is Prominent: {depth_metrics.get('is_prominent', False)}")

    # Per-eye metrics
    if 'right_eye' in eye_metrics:
        print("\nRight Eye:")
        print(f"  Aspect Ratio: {eye_metrics['right_eye']['aspect_ratio']:.6f}")
        print(f"  Width: {eye_metrics['right_eye']['width']:.6f}")
        print(f"  Height: {eye_metrics['right_eye']['height']:.6f}")
        print(f"  Stability: {eye_metrics['right_eye']['measurement_stability']:.4f}")

    if 'left_eye' in eye_metrics:
        print("\nLeft Eye:")
        print(f"  Aspect Ratio: {eye_metrics['left_eye']['aspect_ratio']:.6f}")
        print(f"  Width: {eye_metrics['left_eye']['width']:.6f}")
        print(f"  Height: {eye_metrics['left_eye']['height']:.6f}")
        print(f"  Stability: {eye_metrics['left_eye']['measurement_stability']:.4f}")

    # Nose measurements
    print("\n\n[NOSE ANALYSIS]")
    nose_data = analysis.get('nose_analysis', {})
    nose_details = nose_data.get('details', {})
    nose_measurements = nose_data.get('measurements', {})

    print(f"Classification: {nose_data.get('nose_width', 'N/A')}")
    print(f"Confidence: {nose_data.get('confidence', 0):.4f}")

    print("\nMeasurements:")
    print(f"  Nose to Face Ratio: {nose_details.get('nose_to_face_ratio', 0):.6f}")
    print(f"  Nostril Flare: {nose_details.get('nostril_flare', 0):.6f}")
    print(f"  Measurement Quality: {nose_details.get('measurement_quality', 0):.4f}")

    print("\nThreshold Comparison:")
    ratio = nose_details.get('nose_to_face_ratio', 0)
    thresholds = NoseClassifier.THRESHOLDS
    print(f"  Nose/Face Ratio {ratio:.4f}:")
    print(f"    - Narrow max: {thresholds['narrow_max']:.2f}")
    print(f"    - Medium range: {thresholds['medium_min']:.2f} - {thresholds['medium_max']:.2f}")
    print(f"    - Wide min: >{thresholds['medium_max']:.2f}")

    if nose_measurements:
        print("\nDetailed Measurements:")
        print(f"  Nose Width: {nose_measurements.get('nose_width', 0):.6f}")
        print(f"  Face Width: {nose_measurements.get('face_width', 0):.6f}")
        print(f"  Ala Width: {nose_measurements.get('ala_width', 0):.6f}")
        print(f"  Nostril Width: {nose_measurements.get('nostril_width', 0):.6f}")
        print(f"  Width Samples: {nose_measurements.get('width_samples', 0)}")

    # Lip measurements
    print("\n\n[LIP ANALYSIS]")
    lip_data = analysis.get('lip_analysis', {})
    lip_details = lip_data.get('details', {})
    lip_measurements = lip_data.get('measurements', {})

    print(f"Classification: {lip_data.get('lip_fullness', 'N/A')}")
    print(f"Confidence: {lip_data.get('confidence', 0):.4f}")

    print("\nMeasurements:")
    print(f"  Height to Width Ratio: {lip_details.get('lip_height_to_width_ratio', 0):.6f}")
    print(f"  Lip Balance: {lip_details.get('lip_balance', 'N/A')}")
    print(f"  Measurement Quality: {lip_details.get('measurement_quality', 0):.4f}")

    print("\nThreshold Comparison:")
    ratio = lip_details.get('lip_height_to_width_ratio', 0)
    thresholds = LipClassifier.THRESHOLDS
    print(f"  Lip H/W Ratio {ratio:.4f}:")
    print(f"    - Thin max: {thresholds['thin_max']:.2f}")
    print(f"    - Medium range: {thresholds['medium_min']:.2f} - {thresholds['medium_max']:.2f}")
    print(f"    - Full min: >{thresholds['medium_max']:.2f}")

    if lip_measurements:
        print("\nDetailed Measurements:")
        print(f"  Mouth Width: {lip_measurements.get('mouth_width', 0):.6f}")
        print(f"  Upper Lip Thickness: {lip_measurements.get('upper_lip_thickness', 0):.6f}")
        print(f"  Lower Lip Thickness: {lip_measurements.get('lower_lip_thickness', 0):.6f}")
        print(f"  Total Lip Height: {lip_measurements.get('total_lip_height', 0):.6f}")
        print(f"  Height Samples: {lip_measurements.get('height_samples', 0)}")

    # Quality check
    print("\n\n[QUALITY CHECK]")
    quality = analysis.get('quality_check', {})
    print(f"Quality Score: {quality.get('quality_score', 0):.4f}")
    print(f"Is Acceptable: {quality.get('is_acceptable', False)}")
    warnings = quality.get('warnings', [])
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"  - {warning}")

    print("\n")


def compare_results(results: List[Dict], image_paths: List[str]):
    """Compare results across multiple images"""
    print_header("COMPARISON ACROSS IMAGES")

    print("\nEye Shape Classification:")
    for i, (result, path) in enumerate(zip(results, image_paths), 1):
        eye = result.get('eye_analysis', {})
        print(f"  {i}. {Path(path).name:30s} -> {eye.get('eye_shape', 'N/A'):10s} "
              f"(AR: {eye.get('details', {}).get('aspect_ratio', 0):.4f}, "
              f"EC: {eye.get('details', {}).get('eyelid_coverage', 0):.4f}, "
              f"Angle: {eye.get('details', {}).get('corner_angle', 0):.2f}°)")

    print("\nNose Width Classification:")
    for i, (result, path) in enumerate(zip(results, image_paths), 1):
        nose = result.get('nose_analysis', {})
        print(f"  {i}. {Path(path).name:30s} -> {nose.get('nose_width', 'N/A'):10s} "
              f"(Ratio: {nose.get('details', {}).get('nose_to_face_ratio', 0):.4f})")

    print("\nLip Fullness Classification:")
    for i, (result, path) in enumerate(zip(results, image_paths), 1):
        lip = result.get('lip_analysis', {})
        print(f"  {i}. {Path(path).name:30s} -> {lip.get('lip_fullness', 'N/A'):10s} "
              f"(Ratio: {lip.get('details', {}).get('lip_height_to_width_ratio', 0):.4f})")

    # Check for identical results
    print("\n[IDENTICAL RESULTS CHECK]")
    eye_shapes = [r.get('eye_analysis', {}).get('eye_shape') for r in results]
    nose_widths = [r.get('nose_analysis', {}).get('nose_width') for r in results]
    lip_fullnesses = [r.get('lip_analysis', {}).get('lip_fullness') for r in results]

    if len(set(eye_shapes)) == 1:
        print(f"  ⚠️  WARNING: All images have SAME eye shape: {eye_shapes[0]}")
    else:
        print(f"  ✓ Eye shapes vary: {set(eye_shapes)}")

    if len(set(nose_widths)) == 1:
        print(f"  ⚠️  WARNING: All images have SAME nose width: {nose_widths[0]}")
    else:
        print(f"  ✓ Nose widths vary: {set(nose_widths)}")

    if len(set(lip_fullnesses)) == 1:
        print(f"  ⚠️  WARNING: All images have SAME lip fullness: {lip_fullnesses[0]}")
    else:
        print(f"  ✓ Lip fullnesses vary: {set(lip_fullnesses)}")

    print("\n")


def main():
    """Main diagnostic function"""
    if len(sys.argv) < 2:
        print("Usage: python diagnose_model.py <image1> <image2> [image3] ...")
        print("\nExample:")
        print("  python diagnose_model.py photo1.jpg photo2.jpg photo3.jpg")
        sys.exit(1)

    image_paths = sys.argv[1:]

    # Verify all images exist
    for path in image_paths:
        if not os.path.exists(path):
            print(f"Error: Image not found: {path}")
            sys.exit(1)

    print_header("FACIAL ANALYSIS MODEL DIAGNOSTICS")
    print(f"\nAnalyzing {len(image_paths)} image(s)...")
    print(f"Images: {', '.join(Path(p).name for p in image_paths)}")

    # Initialize analyzer
    analyzer = FaceAnalyzer()

    # Analyze each image
    results = []
    for i, image_path in enumerate(image_paths, 1):
        print(f"\n[{i}/{len(image_paths)}] Processing: {image_path}")

        try:
            with open(image_path, 'rb') as f:
                image_bytes = f.read()

            result = analyzer.analyze_image(image_bytes)

            if 'error' in result:
                print(f"  ❌ Error: {result['error']}")
                print(f"  Message: {result.get('message', 'N/A')}")
                continue

            results.append(result)
            print(f"  ✓ Analysis complete")

        except Exception as e:
            print(f"  ❌ Exception: {str(e)}")
            continue

    if not results:
        print("\n❌ No successful analyses. Exiting.")
        sys.exit(1)

    # Print detailed measurements for each image
    print("\n")
    for result, path in zip(results, image_paths):
        print_raw_measurements(result, path)

    # Compare results if multiple images
    if len(results) > 1:
        compare_results(results, image_paths)

    print_header("DIAGNOSTIC COMPLETE")
    print()


if __name__ == "__main__":
    main()
