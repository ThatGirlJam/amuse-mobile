"""
Test script for facial feature classification

This script helps verify that facial feature classification is working correctly.
Tests: Eye shape, Nose width, and Lip fullness (when implemented)

To use:
1. Ensure the server is running (python run.py)
2. Run: python test_classification.py path/to/test/image.jpg
"""

import sys
import requests
import json


def test_facial_features(image_path):
    """
    Test facial feature classification by uploading an image to the API

    Args:
        image_path: Path to test image file
    """
    api_url = "http://localhost:5000/api/analyze"

    try:
        # Open and upload the image
        with open(image_path, "rb") as image_file:
            files = {"image": image_file}
            response = requests.post(api_url, files=files)

        # Check response
        if response.status_code == 200:
            result = response.json()
            print("✅ Analysis successful!\n")

            # Display eye analysis results
            if "eye_analysis" in result.get("data", {}):
                eye_data = result["data"]["eye_analysis"]

                print("=" * 60)
                print("EYE SHAPE ANALYSIS")
                print("=" * 60)
                print(f"\nPrimary Eye Shape: {eye_data['eye_shape']}")

                if eye_data.get("secondary_features"):
                    print(
                        f"Secondary Features: {', '.join(eye_data['secondary_features'])}"
                    )

                print("\n--- Confidence Scores ---")
                for shape, confidence in eye_data["confidence_scores"].items():
                    print(f"{shape}: {confidence:.2%}")

                print("\n--- Metrics ---")
                metrics = eye_data["metrics"]
                print(f"Aspect Ratio: {metrics['aspect_ratio']:.3f}")
                print(f"Eyelid Coverage: {metrics['eyelid_coverage']:.3f}")
                print(f"Corner Angle: {metrics['corner_angle']:.2f}°")

                print("\n--- Individual Eye Data ---")
                print(
                    f"Right Eye - Width: {metrics['right_eye']['width']:.3f}, Height: {metrics['right_eye']['height']:.3f}"
                )
                print(
                    f"Left Eye - Width: {metrics['left_eye']['width']:.3f}, Height: {metrics['left_eye']['height']:.3f}"
                )

                print("\n" + "=" * 60)

            # Display nose analysis results
            if "nose_analysis" in result.get("data", {}):
                nose_data = result["data"]["nose_analysis"]

                print("\n" + "=" * 60)
                print("NOSE WIDTH ANALYSIS")
                print("=" * 60)
                print(f"\nNose Width Category: {nose_data['nose_width']}")
                print(f"Confidence: {nose_data['confidence']:.2%}")

                print("\n--- Measurements ---")
                measurements = nose_data["measurements"]
                print(f"Nose Width: {measurements['nose_width']:.3f}")
                print(f"Face Width: {measurements['face_width']:.3f}")
                print(f"Nose-to-Face Ratio: {measurements['nose_to_face_ratio']:.3f}")
                print(f"Nostril Width: {measurements['nostril_width']:.3f}")
                print(f"Bridge Width: {measurements['bridge_width']:.3f}")

                print("\n" + "=" * 60)

            # Display lip analysis results
            if "lip_analysis" in result.get("data", {}):
                lip_data = result["data"]["lip_analysis"]

                print("\n" + "=" * 60)
                print("LIP FULLNESS ANALYSIS")
                print("=" * 60)
                print(f"\nLip Fullness Category: {lip_data['lip_fullness']}")
                print(f"Confidence: {lip_data['confidence']:.2%}")
                print(f"Lip Balance: {lip_data['lip_balance']}")

                print("\n--- Measurements ---")
                measurements = lip_data["measurements"]
                print(f"Mouth Width: {measurements['mouth_width']:.3f}")
                print(f"Upper Lip Thickness: {measurements['upper_lip_thickness']:.3f}")
                print(f"Lower Lip Thickness: {measurements['lower_lip_thickness']:.3f}")
                print(f"Total Lip Height: {measurements['total_lip_height']:.3f}")
                print(
                    f"Lip Height-to-Width Ratio: {measurements['lip_height_to_width_ratio']:.3f}"
                )
                print(f"Upper Lip Ratio: {measurements['upper_lip_ratio']:.3f}")
                print(f"Lower Lip Ratio: {measurements['lower_lip_ratio']:.3f}")

                print("\n" + "=" * 60)

            # Save full response for debugging
            with open("test_result.json", "w") as f:
                json.dump(result, f, indent=2)
            print("\n📄 Full response saved to test_result.json")

        else:
            print(f"❌ Error: {response.status_code}")
            print(response.json())

    except FileNotFoundError:
        print(f"❌ Error: Image file not found at {image_path}")
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API. Is the server running?")
        print("   Start the server with: python run.py")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_classification.py <image_path>")
        print("Example: python test_classification.py test_face.jpg")
        sys.exit(1)

    test_facial_features(sys.argv[1])
