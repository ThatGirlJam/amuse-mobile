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

## Tech Stack

**Frontend:**
- Next.js 14 (React 18)
- CSS Modules
- Responsive design (mobile-first)

**Backend:**
- Python Flask API
- Google MediaPipe Face Landmarker for computer vision
- PostgreSQL database
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
# Edit NEXT_PUBLIC_API_URL if needed (default: http://localhost:5000)
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
│   ├── components/
│   │   ├── ImageUpload.jsx      # Image upload component
│   │   └── ImageUpload.module.css
│   ├── globals.css              # Global styles
│   ├── layout.js                # Root layout
│   ├── page.js                  # Home page
│   └── page.module.css
├── lib/
│   └── api.js                   # API service layer
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

## API Endpoints

### Frontend API Service (`lib/api.js`)

```javascript
import { analyzeFace, getAnalysisResults } from '../lib/api';

// Analyze image
const result = await analyzeFace(imageFile, saveToDb);

// Get past results
const results = await getAnalysisResults({ limit: 10 });
```

### Backend REST API (Port 5000)

- `POST /api/analyze` - Analyze facial features
- `GET /api/results` - Get analysis results
- `GET /api/results/<id>` - Get specific result
- `DELETE /api/results/<id>` - Delete result
- `GET /api/health` - Health check

See `/backend/README.md` for detailed API documentation.

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
- **Stage 9**: Results display UI
  - Comprehensive results visualization component
  - Feature analysis cards with confidence scores
  - YouTube search tags display
  - Smooth scroll-to-results functionality
  - Loading skeleton states for better UX
- **Stage 10**: Error handling and polish
  - Enhanced error handling with specific error types
  - User-friendly error messages with actionable guidance
  - Request timeouts and network error handling
  - Full accessibility support (WCAG 2.1 compliant)
  - ARIA labels, roles, and semantic HTML
  - Keyboard navigation support
  - Focus indicators for better keyboard navigation
  - Loading states and skeleton screens
  - Reduced motion support for user preferences

### Future Enhancements 🔮

- YouTube API integration for automatic video fetching
- Skin tone analysis
- User accounts and authentication
- Analysis history dashboard
- Social sharing features

## Environment Variables

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend (`backend/.env`):**
```env
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/facial_analysis
```

## Accessibility Features

Amuse is built with accessibility in mind to ensure all users can benefit from facial analysis:

- **WCAG 2.1 Compliant**: Semantic HTML, ARIA labels, and proper heading hierarchy
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Reader Support**: Descriptive labels and ARIA live regions for dynamic content
- **Reduced Motion**: Respects user's `prefers-reduced-motion` preference
- **Color Contrast**: High-contrast color palette for readability
- **Error Handling**: Clear, actionable error messages with recovery guidance

## Error Handling

The app provides user-friendly error messages for common issues:

- **No Face Detected**: Guidance on taking proper facial photos
- **Multiple Faces**: Instruction to upload single-face images
- **Network Errors**: Connection troubleshooting steps
- **File Errors**: File size and format requirements
- **Server Errors**: Retry options and status information

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

### No face detected

- Ensure photo clearly shows your face
- Use front-facing camera or upload a passport-style photo
- Make sure lighting is adequate
- Remove sunglasses or other face coverings

## Team

Developed by the Amuse team for personalized makeup recommendations.

## License

Educational project.

