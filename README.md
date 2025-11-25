# aMuse
"Beauty that understands you." aMuse is an application that aims to identify a user's facial features and skin tone, 
using this information to recommend makeup products and tutorials that would suit the user. 

## Quick Start

**First-time setup:** See [Installation](#installation) section below to install dependencies and set up the CV model.

**To run the application, you need to start two services in order:**

### Step 1: Start CV Model Service
Open Terminal 1:
```bash
cd cv_model
source venv/bin/activate
python3 run.py
```
Wait until you see: `Server running at: http://0.0.0.0:5000`

### Step 2: Start Next.js App
Open Terminal 2 (keep Terminal 1 running):
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

**⚠️ Important:** The CV model service must be running before starting the Next.js app, otherwise the onboarding feature will fail.

## Tech Stack 
Our responsive web application makes use of:
- React for the UI components and flows
- Next.js 14 for the framework
- Supabase for the database and backend
- ___ for the Computer Vision model that analyses the user's features and skin tone
- ClaudeAPI for the object segmentation (?)
- Python for tutorial recommendations (?) and backend of the application 

## Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Python 3.11 (required for MediaPipe - see note below)
- Supabase account and project

**Note on Python:** The CV model requires Python 3.11 or earlier (MediaPipe doesn't support Python 3.12+). If you have Python 3.14, install Python 3.11:
```bash
brew install python@3.11
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd amuse-mobile
   ```
   This will download the project files, including `package.json` and `cv_model/requirements.txt`.

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```
   This installs all Node.js packages listed in `package.json` (including Next.js, Supabase client, etc.).

3. **Set up CV Model Python environment:**
   ```bash
   cd cv_model
   python3.11 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
   
   This creates a Python virtual environment and installs all Python packages listed in `requirements.txt` (including Flask, MediaPipe, etc.).
   
   **Note:** If you don't have `python3.11`, use `python3` (but ensure it's Python 3.11 or earlier).

4. **Download MediaPipe model file:**
   ```bash
   mkdir -p models
   curl -L -o models/face_landmarker.task \
     https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
   ```
   
   This downloads the face landmarker model (3.6MB) required for facial analysis. The model file is not included in the repository due to size.

5. Set up environment variables:
   Create a `.env.local` file in the root directory with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://felejuwmpqwocqerhcnn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   YOUTUBE_DATA_API_KEY=your_youtube_api_key_here
   CV_MODEL_API_URL=http://localhost:5000
   ```
   
   - You can find your Supabase anon key in your Supabase project settings under API.
   - **IMPORTANT**: Get your Supabase service role key from your Supabase project settings under API → Service Role Key. This key bypasses RLS policies and should NEVER be exposed to the client. Keep it secret!
   - Get your YouTube Data API key from [Google Cloud Console](https://console.cloud.google.com/). Enable the YouTube Data API v3 for your project.
   - `CV_MODEL_API_URL` is the URL of your CV model API (defaults to `http://localhost:5000` if not set). **Note:** On macOS, port 5000 may be used by AirPlay Receiver. If you encounter port conflicts, either disable AirPlay Receiver in System Settings or change the port in `cv_model/run.py` and update this environment variable.

6. **Start the CV Model Service** (Required for onboarding feature):
   
   Open a **new terminal window** and run:
   ```bash
   cd cv_model
   source venv/bin/activate
   python3 run.py
   ```
   
   You should see:
   ```
   ╔═══════════════════════════════════════════╗
   ║  Facial Analysis API - Development Server ║
   ╚═══════════════════════════════════════════╝
   
   Server running at: http://0.0.0.0:5000
   Health check: http://0.0.0.0:5000/api/health
   ```
   
   **Keep this terminal window open** - the CV model service must be running for the onboarding feature to work.

7. **Start the Next.js Development Server**:
   
   In a **separate terminal window**, run:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

## Running the Application

**You need TWO terminal windows** - one for each service:

### Terminal 1: CV Model Service (Start First)
```bash
cd cv_model
source venv/bin/activate
python3 run.py
```

**Expected output:**
```
╔═══════════════════════════════════════════╗
║  Facial Analysis API - Development Server ║
╚═══════════════════════════════════════════╝

Server running at: http://0.0.0.0:5000
Health check: http://0.0.0.0:5000/api/health

Press CTRL+C to stop the server
```

**✅ Keep this terminal open** - the service must stay running.

### Terminal 2: Next.js Development Server (Start Second)
```bash
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

**✅ Keep this terminal open** - the app must stay running.

### Verifying Everything Works

1. **Check CV Model:** Open `http://localhost:5000/api/health` in your browser
   - Should return: `{"status": "healthy", ...}`

2. **Check Next.js App:** Open `http://localhost:3000` in your browser
   - Should show the aMuse homepage

3. **Test Onboarding:** Sign up → Go to onboarding → Take a photo
   - Should successfully analyze and save the image

### Troubleshooting

- **Port 5000 already in use:** Kill the process: `lsof -ti:5000 | xargs kill -9`
- **CV model not found:** Make sure `cv_model/models/face_landmarker.task` exists (3.6MB file)
- **Connection refused:** Ensure CV model service is running before starting Next.js

## Database Schema

The application uses the following Supabase tables:

- **users**: User accounts with profile information
  - Required columns: `id`, `email`, `password_hash`
  - Optional columns: `full_name`, `location`, `timezone`, `mobile_number`, `date_of_birth`, `feature_analysis_id`, `profile_picture_url` (text/string)
- **feature_analysis**: Facial feature analysis results
  - Required columns: `id` (UUID), `eye_shape`, `nose`, `lips`, `created_at`
  - Optional columns: `image` (text/string for image URL)
- **tutorials**: Makeup tutorial videos and metadata
- **user_tutorial_interactions**: User interactions with tutorials (saves, likes, views)

### Database Setup for Onboarding Feature

To enable the onboarding facial analysis feature, you need to:

1. **Add `profile_picture_url` column to `users` table:**
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
   ```

2. **Add `image` column to `feature_analysis` table (if not already present):**
   ```sql
   ALTER TABLE feature_analysis ADD COLUMN IF NOT EXISTS image TEXT;
   ```

3. **Create Supabase Storage Bucket:**
   - Go to your Supabase project dashboard
   - Navigate to Storage
   - Create a new bucket named `profile-pictures`
   - Set it to public (or configure appropriate RLS policies)
   - Configure bucket policies to allow authenticated users to upload files

See the database utility functions in `lib/db/` for available operations.

## Authentication API Endpoints

The application provides the following authentication endpoints:

### 1. POST /api/auth/signup
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

### 2. POST /api/auth/signin
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

### 3. POST /api/auth/signout
Sign out the current user.

**Response:**
```json
{
  "message": "Signed out successfully"
}
```

### 4. GET /api/auth/session
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

### 5. POST /api/auth/reset-password
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

### 6. POST /api/auth/update-password
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

### 7. POST /api/auth/google
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

### 8. GET /api/auth/google/callback
Handle Google OAuth callback (automatically called by Google).

## API Endpoints

The application provides the following REST API endpoints:

### 1. POST /api/users/{user_id}/features
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

### 2. GET /api/users/{user_id}/features
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

### 3. POST /api/tutorials/search
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

### 4. POST /api/users/{user_id}/tutorials/{tutorial_id}/interactions
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

### 5. GET /api/users/{user_id}/tutorials
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

### 6. GET /api/tutorials/cache/{query}
Get cached YouTube API results by query.

**Response:**
```json
{
  "exists": true,
  "items": [...],
  "cached_at": "timestamp"
}
```

## Developer Guide 
To be updated.

