# 🏋️ FormFit AI — Real-Time AI Gym Trainer

An AI-powered fitness coach that uses your **webcam** to track exercises in real time, count reps, analyze form, and give voice feedback — all running locally.

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green?logo=fastapi)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-orange?logo=google)
![Groq](https://img.shields.io/badge/Groq-LLM-purple)

---

## What It Does

| Feature | How It Works |
|---|---|
| **Real-Time Pose Tracking** | Webcam → MediaPipe Pose Landmarker detects 33 body keypoints at ~10 FPS |
| **Automatic Rep Counting** | Joint angle analysis counts reps for each exercise |
| **Form Analysis** | Detects depth issues, back arching, elbow drift, hip sag, and more |
| **Fatigue Estimation** | Tracks rep speed degradation across sets to estimate fatigue |
| **AI Chat Coach** | RAG-powered chatbot answers fitness questions using a curated knowledge base |
| **Dashboard & History** | Charts, heatmaps, radar plots, and per-exercise trends |
| **Voice Coaching** | LLM generates spoken feedback on form issues via gTTS |

---

## Supported Exercises

- 🦵 Squats — tracks knee angle + back alignment
- 💪 Push-ups — monitors body alignment + hip position
- 🏋️ Biceps Curls — detects elbow drift + torso swing
- 🙌 Shoulder Press — checks back arch
- 🚶 Lunges — tracks knee angle + balance

---

## Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js 16 · React 19 · TypeScript · TailwindCSS   │
│  Recharts · Framer Motion · WebSocket Client         │
├─────────────────────────────────────────────────────┤
│                    BACKEND                           │
│  FastAPI · Uvicorn · WebSocket Server                │
│  MediaPipe Pose · OpenCV · NumPy                     │
│  Groq LLM (Qwen 3.8-27B) · gTTS                    │
│  ChromaDB + all-MiniLM-L6-v2 (RAG)                  │
│  SQLite (WAL mode)                                   │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── api/                     # REST endpoints (auth, workout, progress, chat)
│   ├── ws/                      # WebSocket endpoint for live pose streaming
│   ├── detectors/               # Exercise-specific detectors (squat, pushup, etc.)
│   ├── fatigue/                 # Fatigue estimation from rep speed
│   ├── services/
│   │   ├── coaching/            # LLM coach + TTS voice pipeline
│   │   ├── config/              # Workout config & pose connections
│   │   ├── persistence/         # SQLite database layer
│   │   └── rag/                 # ChromaDB knowledge base + guardrails
│   └── ml_models/               # MediaPipe pose model (.task file)
│
├── frontend/
│   └── src/
│       ├── app/                 # Next.js pages (login, dashboard, workout, coach, history)
│       ├── components/          # UI components (camera feed, charts, chat window)
│       ├── hooks/               # React hooks (auth, camera, WebSocket)
│       └── lib/                 # API client + constants
│
├── main.py                      # Legacy Streamlit version (original prototype)
└── requirements.txt             # Root-level dependencies (Streamlit version)
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Groq API key](https://console.groq.com) (free tier works)

### 1. Clone the Repo

```bash
git clone https://github.com/nitinjaraut/Realtime-Voice-Video-AI-GYM-Trainer-Mediapipe-Llamaa.git
cd Realtime-Voice-Video-AI-GYM-Trainer-Mediapipe-Llamaa
```

### 2. Set Up the Backend

```bash
cd backend

# Create a virtual environment
python -m venv ../venv
source ../venv/bin/activate   # macOS/Linux
# .\venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Add your Groq API key
cp .env.example .env
# Edit .env and paste your key
```

> **Note:** The MediaPipe pose model (`ml_models/pose_landmarker_full.task`) is required. Download it from [Google's MediaPipe models](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker#models) and place it in `backend/ml_models/`.

### 3. Set Up the Frontend

```bash
cd frontend
npm install
```

### 4. Run the Project

**Option A — Quick Start (Recommended — One Command):**
```bash
./start.sh
```
> This starts both the FastAPI backend and Next.js frontend together, with automatic health checking and clean shutdown when you press `Ctrl + C`.

**Option B — Manual (Two Terminals):**

**Terminal 1 — Backend (port 8000):**
```bash
cd backend
source ../venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend (port 3000):**
```bash
cd frontend
npm run dev
```

### 5. Open the App

Go to **http://localhost:3000** → enter a username → start working out!

---

## How the Workout Flow Works

```
Browser Camera  →  Capture Frame (JPEG)
       ↓
  WebSocket   →  Send base64 frame to backend
       ↓
  MediaPipe   →  Detect 33 pose landmarks
       ↓
  Detector    →  Calculate joint angles → Count reps → Check form
       ↓
  WebSocket   →  Send metrics + skeleton back to frontend
       ↓
  Canvas       →  Draw skeleton overlay on live video
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login / create user |
| POST | `/api/workouts/save` | Save a completed workout |
| GET | `/api/workouts/{user_id}` | Get workout history |
| GET | `/api/progress/{user_id}/dashboard` | Dashboard data (fatigue, heatmap, radar) |
| GET | `/api/progress/{user_id}/stats` | Overall statistics |
| POST | `/api/chat/ask` | Ask the AI coach (RAG) |
| WS | `/ws/pose` | Real-time pose detection stream |
| GET | `/api/health` | Health check |

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | `backend/.env` | API key for Groq LLM (powers AI coach + voice feedback) |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Backend URL (defaults to `http://localhost:8000`) |
| `NEXT_PUBLIC_WS_URL` | `frontend/.env.local` | WebSocket URL (defaults to `ws://localhost:8000`) |

---

## Screenshots

The app features a dark glassmorphism UI with:
- **Login Page** — clean username entry with gradient branding
- **Dashboard** — metric cards, fatigue gauge, activity heatmap, form radar chart
- **Workout Studio** — live camera feed with skeleton overlay, real-time rep counter, and AI coach feedback
- **AI Coach** — chat interface with RAG-powered responses and medical guardrails
- **History** — card grid of past workout sessions with form scores

---

## License

MIT

---

Built with ❤️ using MediaPipe, FastAPI, Next.js, and Groq
