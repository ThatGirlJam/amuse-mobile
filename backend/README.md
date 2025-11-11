# Facial Analysis API - Backend

Python Flask API for analyzing facial features using Google's MediaPipe Face Landmarker. This service detects faces, extracts 478 facial landmarks, and classifies features like eye shape, nose width, and lip fullness to provide makeup recommendations.

## Features

**Completed:**

- ✅ Face detection using MediaPipe Face Landmarker (Stage 1)
- ✅ 478 facial landmark extraction (Stage 1)
- ✅ Health check endpoint (Stage 1)
- ✅ Image upload and analysis endpoint (Stage 1)
- ✅ Error handling for no face / multiple faces (Stage 1)
- ✅ Eye shape classification with 6 categories (Stage 2)
  - Almond, Round, Monolid, Hooded, Upturned, Downturned
  - Geometric analysis: aspect ratio, eyelid coverage, corner angles
  - Confidence scores for each classification
- ✅ Nose width classification with 3 categories (Stage 3)
  - Narrow, Medium, Wide
  - Nose-to-face width ratio calculation
  - Nostril and bridge width measurements
- ✅ Lip fullness classification with 3 categories (Stage 4)
  - Thin, Medium, Full
  - Lip height-to-mouth width ratio calculation
  - Upper and lower lip measurements
  - Lip balance assessment (balanced, upper/lower dominant)

- ✅ Unified analysis summary with YouTube search tags (Stage 5)
  - Consolidated feature summary
  - Search tags for content scraping
  - Makeup-specific keywords by feature
  - Human-readable descriptions
- ✅ Database persistence with PostgreSQL (Stage 6)
  - Save analysis results automatically
  - Retrieve past analyses by ID
  - Search analyses by facial features
  - Delete stored results

**In Progress:**

- 🚧 Next.js frontend integration (Stages 7-10)

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

### 3. Set Up PostgreSQL Database

**Install PostgreSQL** (if not already installed):

```bash
# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows: Download installer from postgresql.org
```

**Create database:**

```bash
# Create database for the application
createdb facial_analysis

# Or use psql:
psql postgres
CREATE DATABASE facial_analysis;
\q
```

**Configure database connection:**

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and update DATABASE_URL if needed:
# DATABASE_URL=postgresql://user:password@localhost:5432/facial_analysis
```

### 4. Initialize Database Tables

```bash
python init_db.py
```

This will create all necessary database tables for storing analysis results.

### 5. Download MediaPipe Model

Download the Face Landmarker model file from MediaPipe:

```bash
# Create models directory
mkdir -p models

# Download the model using curl:
curl -L -o models/face_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
```

**Model file should be placed at:** `backend/models/face_landmarker.task`

### 6. Run the Server

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
    },
    "eye_analysis": {
      "eye_shape": "Almond",
      "secondary_features": ["Upturned"],
      "confidence_scores": {
        "Almond": 0.75,
        "Upturned": 0.45
      },
      "metrics": {
        "aspect_ratio": 0.42,
        "eyelid_coverage": 0.38,
        "corner_angle": 4.2
      }
    },
    "nose_analysis": {
      "nose_width": "medium",
      "confidence": 0.85,
      "measurements": {
        "nose_width": 0.12,
        "face_width": 0.38,
        "nose_to_face_ratio": 0.316,
        "nostril_width": 0.08,
        "bridge_width": 0.05
      }
    },
    "lip_analysis": {
      "lip_fullness": "medium",
      "confidence": 0.85,
      "lip_balance": "slightly_lower_dominant",
      "measurements": {
        "mouth_width": 0.15,
        "upper_lip_thickness": 0.018,
        "lower_lip_thickness": 0.022,
        "total_lip_height": 0.040,
        "lip_height_to_width_ratio": 0.267,
        "upper_lip_ratio": 0.120,
        "lower_lip_ratio": 0.147
      }
    },
    "summary": {
      "features": {
        "eye_shape": "Almond",
        "eye_secondary": ["Upturned"],
        "nose_width": "medium",
        "lip_fullness": "medium",
        "lip_balance": "slightly_lower_dominant"
      },
      "overall_confidence": 0.817,
      "description": "Your facial features include Almond upturned eyes, a medium nose, and medium lips with a slightly lower dominant lip balance.",
      "search_tags": [
        "Almond eyes medium nose medium lips",
        "Almond eye makeup",
        "medium nose makeup",
        "medium lips makeup",
        "Upturned eyes makeup",
        "Almond Upturned eyes",
        "makeup for medium nose",
        "makeup for medium lips",
        "winged eyeliner",
        "natural contour"
      ],
      "makeup_keywords": {
        "eye": ["Almond", "eye makeup", "eyeshadow", "winged eyeliner", "cat eye"],
        "nose": ["medium", "nose contour", "nose makeup", "natural contour"],
        "lip": ["medium", "lip makeup", "lipstick", "natural lip", "balance upper lip"]
      },
      "feature_summary": {
        "eyes": {
          "primary": "Almond",
          "secondary": ["Upturned"]
        },
        "nose": {
          "width": "medium"
        },
        "lips": {
          "fullness": "medium",
          "balance": "slightly_lower_dominant"
        }
      }
    }
  }
}
```

**Note**: The `summary` field provides a unified view of all features, including:

- **features**: All classified features in one place
- **overall_confidence**: Average confidence across all classifications
- **description**: Human-readable description of facial features
- **search_tags**: Ready-to-use search queries for YouTube/content scraping
- **makeup_keywords**: Categorized keywords for each facial feature
- **feature_summary**: Clean structure for quick frontend consumption

**Optional Parameters:**

- `save` (form data): Whether to save results to database (default: "true"). Set to "false" to skip database save.

**Success Response includes:**

- `saved_id`: Database ID of saved result (null if not saved or save failed)

**Error Responses:**

_No face detected (400):_

```json
{
  "error": "No face detected in image",
  "face_detected": false,
  "num_faces": 0,
  "message": "Please ensure the image contains a clear, front-facing face"
}
```

_Multiple faces (400):_

```json
{
  "error": "Multiple faces detected",
  "face_detected": true,
  "num_faces": 3,
  "message": "Please upload an image with only one face"
}
```

_Invalid file type (400):_

```json
{
  "error": "Invalid file type",
  "message": "Allowed types: png, jpg, jpeg, webp"
}
```

### Get Analysis Result by ID

**GET** `/api/results/<result_id>`

Retrieve a specific saved analysis result.

**Example:**

```bash
curl http://localhost:5000/api/results/1
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "created_at": "2025-11-10T12:00:00",
    "features": {
      "eye_shape": "Almond",
      "eye_secondary": ["Upturned"],
      "nose_width": "medium",
      "lip_fullness": "medium",
      "lip_balance": "slightly_lower_dominant"
    },
    "confidence": {
      "eye": 0.75,
      "nose": 0.85,
      "lip": 0.85,
      "overall": 0.817
    },
    "description": "Your facial features include Almond upturned eyes...",
    "search_tags": ["Almond eyes medium nose medium lips", ...],
    "full_analysis": { ... }
  }
}
```

### Get Recent or Search Analysis Results

**GET** `/api/results`

Get recent analysis results or search by facial features.

**Query Parameters:**

- `limit` (optional): Maximum results to return (default: 10)
- `eye_shape` (optional): Filter by eye shape (e.g., "Almond", "Round")
- `nose_width` (optional): Filter by nose width (e.g., "narrow", "medium", "wide")
- `lip_fullness` (optional): Filter by lip fullness (e.g., "thin", "medium", "full")

**Examples:**

```bash
# Get 10 most recent results
curl http://localhost:5000/api/results

# Get results for Almond eyes
curl http://localhost:5000/api/results?eye_shape=Almond

# Get results with specific features
curl "http://localhost:5000/api/results?eye_shape=Almond&nose_width=medium&limit=5"
```

**Success Response (200):**

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "created_at": "2025-11-10T12:00:00",
      "features": { ... },
      "confidence": { ... },
      "description": "...",
      "search_tags": [...],
      "full_analysis": { ... }
    },
    ...
  ]
}
```

### Delete Analysis Result

**DELETE** `/api/results/<result_id>`

Delete a specific analysis result from the database.

**Example:**

```bash
curl -X DELETE http://localhost:5000/api/results/1
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Analysis result 1 deleted successfully"
}
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── routes.py                # API endpoints
│   ├── models.py                # Database models (SQLAlchemy)
│   ├── services/
│   │   ├── __init__.py
│   │   └── analysis_service.py  # Database operations
│   └── utils/
│       ├── __init__.py
│       ├── face_analyzer.py     # MediaPipe integration & main analyzer
│       ├── eye_classifier.py    # Eye shape classification logic
│       ├── nose_classifier.py   # Nose width classification logic
│       ├── lip_classifier.py    # Lip fullness classification logic
│       └── summary_formatter.py # Unified summary and search tags
├── models/
│   └── face_landmarker.task     # MediaPipe model (download separately)
├── requirements.txt             # Python dependencies
├── run.py                       # Development server entry point
├── init_db.py                   # Database initialization script
├── test_classification.py       # Test script for facial analysis
├── .env.example                # Example environment variables
├── .gitignore
└── README.md
```

## Development

### Testing the API

**Option 1: Using the test script (recommended)**

```bash
# Start the server
python run.py

# In a new terminal, run the test script
python test_classification.py path/to/test_image.jpg
```

The test script will display formatted eye analysis results and save the full JSON response to `test_result.json`.

**Option 2: Using curl**

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

## Implementation Progress

**Backend (Complete):**

- ✅ **Stage 1**: Python backend with MediaPipe Face Landmarker
- ✅ **Stage 2**: Eye shape classification (Almond, Round, Monolid, Hooded, Upturned, Downturned)
- ✅ **Stage 3**: Nose width classification (Narrow, Medium, Wide)
- ✅ **Stage 4**: Lip fullness classification (Thin, Medium, Full)
- ✅ **Stage 5**: Unified analysis summary with YouTube search tags
- ✅ **Stage 6**: PostgreSQL database integration for storing results

**Frontend (To Do):**

- 🚧 **Stage 7**: Next.js image upload component
- 🚧 **Stage 8**: Next.js API integration layer
- 🚧 **Stage 9**: Results display UI
- 🚧 **Stage 10**: Error handling and polish

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

### Database connection errors

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solution:**

1. Ensure PostgreSQL is running:

```bash
# macOS
brew services list
brew services start postgresql

# Ubuntu/Linux
sudo systemctl status postgresql
sudo systemctl start postgresql
```

2. Verify database exists:

```bash
psql -l | grep facial_analysis
```

3. Check DATABASE_URL in `.env` is correct

### Database not saving results

If the API works but results aren't being saved:

1. Run database initialization: `python init_db.py`
2. Check PostgreSQL logs for errors
3. Verify database permissions for your user

## License

Part of the Amuse mobile app project.
