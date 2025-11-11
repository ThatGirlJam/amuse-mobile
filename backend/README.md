# Facial Analysis API - Backend

Python Flask API for analyzing facial features using Google's MediaPipe Face Landmarker. This service detects faces, extracts 478 facial landmarks, and classifies features like eye shape, nose width, and lip fullness to provide makeup recommendations.

## Features (Stage 1)

- ✅ Face detection using MediaPipe Face Landmarker
- ✅ 478 facial landmark extraction
- ✅ Health check endpoint
- ✅ Image upload and analysis endpoint
- ✅ Error handling for no face / multiple faces
- 🚧 Feature classification (Stages 2-4)
- 🚧 Database persistence (Stage 6)

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download MediaPipe Model

Download the Face Landmarker model file from MediaPipe:

```bash
# Create models directory
mkdir -p models

# Download the model (you'll need to do this manually or via curl/wget)
# Visit: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task

# Using curl:
curl -L -o models/face_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
```

**Model file should be placed at:** `backend/models/face_landmarker.task`

### 4. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env if needed (defaults should work for development)
```

### 5. Run the Server

```bash
python run.py
```

The API will be available at: `http://localhost:5000`

## API Endpoints

### Health Check

**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "facial-analysis-api",
  "timestamp": "2025-11-10T12:00:00.000000",
  "version": "1.0.0"
}
```

### Analyze Face

**POST** `/api/analyze`

Upload an image and analyze facial features.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with key `image` containing the image file

**Supported formats:** PNG, JPG, JPEG, WEBP

**Example using curl:**
```bash
curl -X POST http://localhost:5000/api/analyze \
  -F "image=@path/to/your/image.jpg"
```

**Success Response (200):**
```json
{
  "success": true,
  "timestamp": "2025-11-10T12:00:00.000000",
  "data": {
    "face_detected": true,
    "num_faces": 1,
    "num_landmarks": 478,
    "landmarks": [
      {"x": 0.5, "y": 0.5, "z": 0.0},
      ...
    ],
    "image_dimensions": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

**Error Responses:**

*No face detected (400):*
```json
{
  "error": "No face detected in image",
  "face_detected": false,
  "num_faces": 0,
  "message": "Please ensure the image contains a clear, front-facing face"
}
```

*Multiple faces (400):*
```json
{
  "error": "Multiple faces detected",
  "face_detected": true,
  "num_faces": 3,
  "message": "Please upload an image with only one face"
}
```

*Invalid file type (400):*
```json
{
  "error": "Invalid file type",
  "message": "Allowed types: png, jpg, jpeg, webp"
}
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── routes.py            # API endpoints
│   └── utils/
│       ├── __init__.py
│       └── face_analyzer.py # MediaPipe integration
├── models/
│   └── face_landmarker.task # MediaPipe model (download separately)
├── requirements.txt         # Python dependencies
├── run.py                   # Development server entry point
├── .env.example            # Example environment variables
├── .gitignore
└── README.md
```

## Development

### Testing the API

1. Start the server: `python run.py`
2. Check health: `curl http://localhost:5000/api/health`
3. Test with an image:
   ```bash
   curl -X POST http://localhost:5000/api/analyze \
     -F "image=@test_face.jpg" \
     | python -m json.tool
   ```

### CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (Next.js default port)
- `http://localhost:3001`

To add more origins, edit `app/__init__.py`:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "your-origin-here"],
        ...
    }
})
```

## Next Stages

- **Stage 2**: Eye shape classification (Almond, Round, Monolid, Hooded, Upturned, Downturned)
- **Stage 3**: Nose width classification (Narrow, Medium, Wide)
- **Stage 4**: Lip fullness classification (Thin, Medium, Full)
- **Stage 5**: Unified analysis endpoint with all features
- **Stage 6**: Database integration for storing results

## Troubleshooting

### Model file not found
```
Failed to initialize Face Landmarker: Failed to open model file
```
**Solution:** Download the model file and place it in `backend/models/face_landmarker.task`

### Import errors
```
ModuleNotFoundError: No module named 'mediapipe'
```
**Solution:** Ensure virtual environment is activated and run `pip install -r requirements.txt`

### Port already in use
```
OSError: [Errno 48] Address already in use
```
**Solution:** Change the port in `.env` file or kill the process using port 5000

## License

Part of the Amuse mobile app project.
