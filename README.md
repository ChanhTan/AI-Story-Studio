# AI Story Video Creator

A powerful localhost application for automatically generating cinematic story videos using AI. Paste any story, and the application will analyze it, generate images, create voice narration, and build a complete video - all automatically.

## Features

- One-click story-to-video generation
- Gemini AI story analysis and scene detection
- Automatic image generation via Perchance AI
- Edge TTS voice narration
- FFmpeg video composition with Ken Burns effects
- SRT/ASS subtitle generation
- Background music support
- Real-time progress tracking via WebSocket
- Modern dark-themed UI with Windows 11 design language

## Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- shadcn/ui components
- Framer Motion
- React Query

### Backend
- Python 3.12
- FastAPI
- Playwright (browser automation)
- Edge-TTS
- FFmpeg
- Pillow

## Prerequisites

- **Node.js** 18+
- **Python** 3.12+
- **FFmpeg** (install via `winget install ffmpeg` or from https://ffmpeg.org)
- **Google Gemini API key** (get from https://aistudio.google.com/apikey)

## Installation

### 1. Clone and enter the project

```bash
cd "AI Tool storys"
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Copy and configure environment
copy ..\.env.example ..\.env
# Edit .env with your Gemini API key
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

## Running the Application

### Terminal 1: Start Backend

```bash
cd backend
.\venv\Scripts\activate
python main.py
```

The backend starts at http://localhost:8000

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

The frontend starts at http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Go to **Settings** and enter your Gemini API key
3. Navigate to **Script** and paste your story
4. Click **Analyze Story** to generate scenes
5. Click **Generate All** or generate images/voice/video individually
6. Wait for the pipeline to complete
7. Preview and download your video

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration management
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── routers/
│   │   ├── api.py           # REST API endpoints
│   │   └── ws.py            # WebSocket handler
│   ├── services/
│   │   ├── gemini_service.py   # Gemini AI integration
│   │   ├── image_service.py    # Perchance AI image generation
│   │   ├── voice_service.py    # Edge TTS voice generation
│   │   ├── video_service.py    # FFmpeg video composition
│   │   └── subtitle_service.py # SRT/ASS subtitle generation
│   └── utils/
│       └── logger.py        # Logging configuration
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main app with routing
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities
│   ├── package.json
│   └── vite.config.ts
├── assets/                  # Static assets
├── cache/                   # Image cache
├── images/                  # Generated images
├── audio/                   # Generated audio
├── videos/                  # Video segments
├── subtitles/               # Subtitle files
├── output/                  # Final video output
├── logs/                    # Application logs
└── config/                  # Configuration files
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-scenes` | Analyze story with Gemini |
| POST | `/api/generate-images` | Generate images via Perchance |
| POST | `/api/generate-voice` | Generate voice narration |
| POST | `/api/build-video` | Build final video |
| POST | `/api/generate-all` | Run full pipeline |
| GET | `/api/progress/:taskId` | Get task progress |
| GET | `/api/history` | Get project history |
| GET | `/api/settings` | Get settings |
| POST | `/api/settings` | Update settings |
| WS | `/ws` | WebSocket for live updates |

## License

MIT
