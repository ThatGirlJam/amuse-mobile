"""
Test script for eye classification

This script helps verify that eye shape classification is working correctly.
To use:
1. Ensure the server is running (python run.py)
2. Run: python test_eye_classification.py path/to/test/image.jpg
"""

import sys
import requests
import json


def test_eye_classification(image_path):
    """
    Test eye classification by uploading an image to the API

    Args:
        image_path: Path to test image file
    """
    api_url = "http://localhost:5000/api/analyze"

    try:
        # Open and upload the image
        with open(image_path, 'rb') as image_file:
            files = {'image': image_file}
            response = requests.post(api_url, files=files)

        # Check response
        if response.status_code == 200:
            result = response.json()
            print("✅ Analysis successful!\n")

            # Display eye analysis results
            if 'eye_analysis' in result.get('data', {}):
                eye_data = result['data']['eye_analysis']

                print("=" * 60)
                print("EYE SHAPE ANALYSIS")
                print("=" * 60)
                print(f"\nPrimary Eye Shape: {eye_data['eye_shape']}")

                if eye_data.get('secondary_features'):
                    print(f"Secondary Features: {', '.join(eye_data['secondary_features'])}")

                print("\n--- Confidence Scores ---")
                for shape, confidence in eye_data['confidence_scores'].items():
                    print(f"{shape}: {confidence:.2%}")

                print("\n--- Metrics ---")
                metrics = eye_data['metrics']
                print(f"Aspect Ratio: {metrics['aspect_ratio']:.3f}")
                print(f"Eyelid Coverage: {metrics['eyelid_coverage']:.3f}")
                print(f"Corner Angle: {metrics['corner_angle']:.2f}°")

                print("\n--- Individual Eye Data ---")
                print(f"Right Eye - Width: {metrics['right_eye']['width']:.3f}, Height: {metrics['right_eye']['height']:.3f}")
                print(f"Left Eye - Width: {metrics['left_eye']['width']:.3f}, Height: {metrics['left_eye']['height']:.3f}")

                print("\n" + "=" * 60)

            # Save full response for debugging
            with open('test_result.json', 'w') as f:
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


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python test_eye_classification.py <image_path>")
        print("Example: python test_eye_classification.py test_face.jpg")
        sys.exit(1)

    test_eye_classification(sys.argv[1])
