# aMuse
"Beauty that understands you." aMuse is an application that aims to identify a user's facial features and skin tone, 
using this information to recommend makeup products and tutorials that would suit the user. 

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
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://felejuwmpqwocqerhcnn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   YOUTUBE_DATA_API_KEY=your_youtube_api_key_here
   ```
   
   - You can find your Supabase anon key in your Supabase project settings under API.
   - Get your YouTube Data API key from [Google Cloud Console](https://console.cloud.google.com/). Enable the YouTube Data API v3 for your project.

4. Run the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following Supabase tables:

- **users**: User accounts with profile information
- **feature_analysis**: Facial feature analysis results
- **tutorials**: Makeup tutorial videos and metadata
- **user_tutorial_interactions**: User interactions with tutorials (saves, likes, views)

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

