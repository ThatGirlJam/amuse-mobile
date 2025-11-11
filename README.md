# Amuse
**"Beauty that understands you."**

Amuse is an AI-powered web application that identifies a user's facial features using computer vision, then recommends personalized makeup tutorials from YouTube that suit their unique features.

## Features

- 📸 **Image Upload & Camera Capture** - Upload photos or take selfies
- 🤖 **AI Facial Analysis** - Powered by Google MediaPipe Face Landmarker
- 👁️ **Eye Shape Detection** - Almond, Round, Monolid, Hooded, Upturned, Downturned
- 👃 **Nose Width Analysis** - Narrow, Medium, Wide
- 💋 **Lip Fullness Classification** - Thin, Medium, Full
- 🎥 **YouTube Tutorial Tags** - Personalized search queries for makeup content
- 💾 **Result Storage** - PostgreSQL database for analysis history
- 🔐 **User Authentication** - Sign up, sign in, password reset, and Google OAuth
- 📚 **Tutorial Management** - Save, like, and track viewed tutorials

## Tech Stack

**Frontend:**
- React for UI components and flows
- Next.js 14 for the framework
- CSS Modules for styling
- Responsive design (mobile-first)

**Backend:**
- Python Flask API for facial analysis
- Google MediaPipe Face Landmarker for computer vision
- Supabase for user database and authentication
- PostgreSQL database for analysis results
- SQLAlchemy ORM

**Analysis Features:**
- Custom geometric algorithms for facial feature classification
- 478-point facial landmark detection
- Confidence scoring for each classification

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL
- Supabase account and project

### Installation

1. **Clone and install frontend dependencies**

```bash
git clone <repository-url>
cd amuse-mobile
npm install
```

2. **Configure environment**

```bash
# Frontend configuration
cp .env.example .env.local
# Edit the following variables in .env.local:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - YOUTUBE_DATA_API_KEY
# - NEXT_PUBLIC_API_URL (default: http://localhost:5000)
# - NEXT_PUBLIC_APP_URL (default: http://localhost:3000)
```

3. **Set up Python backend**

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL
createdb facial_analysis
python init_db.py

# Download MediaPipe model
mkdir -p models
curl -L -o models/face_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
```

4. **Start both servers**

```bash
# Terminal 1: Start backend (from backend/)
python run.py

# Terminal 2: Start frontend (from root)
npm run dev
```

5. **Open the app**

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
amuse-mobile/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── tutorials/            # Tutorial search and cache
│   │   └── users/                # User features and tutorials
│   ├── components/
│   │   ├── ImageUpload.jsx      # Image upload component
│   │   └── ImageUpload.module.css
│   ├── globals.css              # Global styles
│   ├── layout.js                # Root layout
│   ├── page.js                  # Home page
│   └── page.module.css
├── lib/
│   ├── api.js                   # Facial analysis API service
│   ├── auth-client.js           # Supabase auth client
│   ├── supabase.js              # Supabase client
│   └── db/                      # Database utilities
│       ├── users.js
│       ├── tutorials.js
│       ├── feature-analysis.js
│       └── user-tutorial-interactions.js
├── backend/                     # Python Flask API
│   ├── app/
│   │   ├── models.py           # Database models
│   │   ├── routes.py           # API endpoints
│   │   ├── services/           # Business logic
│   │   └── utils/              # Feature classifiers
│   │       ├── face_analyzer.py
│   │       ├── eye_classifier.py
│   │       ├── nose_classifier.py
│   │       ├── lip_classifier.py
│   │       └── summary_formatter.py
│   ├── models/                 # ML model files
│   ├── requirements.txt
│   └── run.py
├── .env.example
├── package.json
└── README.md
```

## How It Works

1. **Upload Image** - User uploads a front-facing photo
2. **MediaPipe Detection** - Extracts 478 facial landmarks
3. **Feature Classification** - Custom algorithms analyze:
   - Eye aspect ratio, eyelid coverage, corner angles
   - Nose-to-face width ratio
   - Lip height-to-width ratio
4. **Generate Tags** - Creates YouTube-ready search queries
5. **Save Results** - Stores analysis in PostgreSQL database
6. **Tutorial Recommendations** - Searches YouTube and ranks tutorials based on facial features

## Database Schema

The application uses the following Supabase tables:

- **users**: User accounts with profile information
- **feature_analysis**: Facial feature analysis results
- **tutorials**: Makeup tutorial videos and metadata
- **user_tutorial_interactions**: User interactions with tutorials (saves, likes, views)

See the database utility functions in `lib/db/` for available operations.

## API Endpoints

### Authentication API Endpoints

#### 1. POST /api/auth/signup
Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "mobile_number": "+1234567890",
  "date_of_birth": "1990-01-01"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  },
  "message": "User created successfully. Please check your email to verify your account."
}
```

#### 2. POST /api/auth/signin
Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_verified": true
  },
  "session": {
    "access_token": "...",
    "expires_at": 1234567890
  }
}
```

#### 3. POST /api/auth/signout
Sign out the current user.

**Response:**
```json
{
  "message": "Signed out successfully"
}
```

#### 4. GET /api/auth/session
Get the current user session.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_verified": true,
    "full_name": "John Doe",
    "mobile_number": "+1234567890",
    "date_of_birth": "1990-01-01",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "expires_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 5. POST /api/auth/reset-password
Send password reset email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "redirectTo": "http://localhost:3000/reset-password"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### 6. POST /api/auth/update-password
Update user password (requires authentication).

**Request Body:**
```json
{
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

#### 7. POST /api/auth/google
Initiate Google OAuth sign in.

**Request Body:**
```json
{
  "redirectTo": "http://localhost:3000/api/auth/google/callback"
}
```

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### 8. GET /api/auth/google/callback
Handle Google OAuth callback (automatically called by Google).

### Facial Analysis API (Python Backend)

#### Frontend API Service (`lib/api.js`)

```javascript
import { analyzeFace, getAnalysisResults } from '../lib/api';

// Analyze image
const result = await analyzeFace(imageFile, saveToDb);

// Get past results
const results = await getAnalysisResults({ limit: 10 });
```

#### Backend REST API (Port 5000)

- `POST /api/analyze` - Analyze facial features
- `GET /api/results` - Get analysis results
- `GET /api/results/<id>` - Get specific result
- `DELETE /api/results/<id>` - Delete result
- `GET /api/health` - Health check

See `/backend/README.md` for detailed API documentation.

### Tutorial API Endpoints

#### 1. POST /api/users/{user_id}/features
Save and update user's facial features.

**Request Body:**
```json
{
  "eye_shape": "almond",
  "nose": "medium",
  "lips": "full",
  "image": "image_reference"
}
```

**Response:**
```json
{
  "message": "Feature analysis saved successfully",
  "feature_analysis_id": "uuid",
  "features": {
    "eye_shape": "almond",
    "nose": "medium",
    "lips": "full"
  }
}
```

#### 2. GET /api/users/{user_id}/features
Get user's facial features.

**Response:**
```json
{
  "feature_analysis_id": "uuid",
  "eye_shape": "almond",
  "nose": "medium",
  "lips": "full",
  "created_at": "timestamp"
}
```

#### 3. POST /api/tutorials/search
Search for makeup tutorials based on facial features. Searches YouTube, scores results, stores tutorials, and returns a ranked list.

**Request Body:**
```json
{
  "user_id": "uuid",
  "eye_shape": "almond",
  "nose": "medium",
  "lips": "full",
  "max_results": 20,
  "force_refresh": false
}
```

**Response:**
```json
{
  "cached": true,
  "query_set": ["makeup tutorial eyes almond", ...],
  "results": [
    {
      "tutorial_id": "uuid",
      "title": "Tutorial Title",
      "url": "https://youtube.com/watch?v=...",
      "channel": "Channel Name",
      "score": 5,
      "query": "makeup tutorial eyes almond",
      "matched_features": ["almond"]
    }
  ]
}
```

#### 4. POST /api/users/{user_id}/tutorials/{tutorial_id}/interactions
Update saved/liked/view state for a tutorial.

**Request Body:**
```json
{
  "is_saved": true,
  "is_liked": false,
  "increment_view": true,
  "matched_features": {"eye_shape": "almond"}
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "tutorial_id": "uuid",
  "is_saved": true,
  "is_liked": false,
  "view_count": 1,
  "matched_features": {"eye_shape": "almond"}
}
```

#### 5. GET /api/users/{user_id}/tutorials
Fetch all tutorials personalized for the user.

**Query Parameters:**
- `filter`: "saved", "liked", or "all" (default: "all")

**Response:**
```json
{
  "tutorials": [
    {
      "tutorial_id": "uuid",
      "title": "Tutorial Title",
      "url": "https://youtube.com/watch?v=...",
      "channel": "Channel Name",
      "score": 5,
      "query": "makeup tutorial eyes almond",
      "matched_features": ["almond"],
      "is_liked": false,
      "is_saved": true,
      "view_count": 3
    }
  ]
}
```

#### 6. GET /api/tutorials/cache/{query}
Get cached YouTube API results by query.

**Response:**
```json
{
  "exists": true,
  "items": [...],
  "cached_at": "timestamp"
}
```

## Development Progress

### Completed ✅

- **Stage 1**: Python backend with MediaPipe Face Landmarker
- **Stage 2**: Eye shape classification
- **Stage 3**: Nose width classification
- **Stage 4**: Lip fullness classification
- **Stage 5**: Unified summary with YouTube search tags
- **Stage 6**: PostgreSQL database integration
- **Stage 7**: Next.js image upload UI
- **Stage 8**: API integration layer
- **Authentication**: User signup, signin, password reset, Google OAuth
- **Tutorial Management**: Search, save, like, and track tutorials

### In Progress 🚧

- **Stage 9**: Results display UI
- **Stage 10**: Error handling and polish

### Future Enhancements 🔮

- Enhanced YouTube API integration for automatic video fetching
- Skin tone analysis
- Analysis history dashboard
- Social sharing features
- Advanced recommendation algorithms

## Environment Variables

**Frontend (`.env.local`):**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# YouTube Data API
YOUTUBE_DATA_API_KEY=your-youtube-api-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Python Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend (`backend/.env`):**
```env
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/facial_analysis
MAX_UPLOAD_SIZE_MB=10
```

## Troubleshooting

### Backend not connecting

1. Ensure backend is running: `cd backend && python run.py`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify CORS settings in `backend/app/__init__.py`

### Camera not working

- Use HTTPS or localhost
- Grant camera permissions
- Try file upload instead

### Database errors

```bash
cd backend
python init_db.py  # Reinitialize database
```

### Supabase connection issues

1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
2. Check Supabase project is active
3. Ensure API keys have correct permissions

## Team

Developed by the Amuse team for personalized makeup recommendations.

## License

Educational project.
