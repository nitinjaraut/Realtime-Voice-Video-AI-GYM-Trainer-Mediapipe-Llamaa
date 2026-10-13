#!/bin/bash

# FormFit AI - Full-Stack Runner Script
# Runs FastAPI Backend + Next.js Frontend concurrently and terminates both cleanly on Ctrl+C.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=================================================="
echo "🏋️  Starting FormFit AI Full-Stack Application"
echo "=================================================="

# 1. Clean up any stale Next.js dev server on port 3000/3001 if left hanging
EXISTING_NEXT=$(lsof -ti :3000 | xargs ps -u -o pid,command | grep "next-server" | awk '{print $1}')
if [ -n "$EXISTING_NEXT" ]; then
    echo "ℹ️  Stopping previous Next.js instance (PID $EXISTING_NEXT)..."
    kill -9 $EXISTING_NEXT 2>/dev/null
fi

# 2. Check Python Virtual Environment
VENV_PATH="$PROJECT_DIR/venv"
if [ ! -d "$VENV_PATH" ]; then
    echo "❌ Virtual environment not found at $VENV_PATH"
    echo "   Please create it: python3 -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt"
    exit 1
fi

# Trap Ctrl+C (SIGINT) and SIGTERM to kill all background child processes
cleanup() {
    echo ""
    echo "👋 Shutting down FormFit AI..."
    kill $(jobs -p) 2>/dev/null
    wait $(jobs -p) 2>/dev/null
    echo "✅ All servers stopped cleanly."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start Backend
echo "🚀 [1/2] Starting Backend (FastAPI on http://127.0.0.1:8000)..."
cd "$BACKEND_DIR"
source "$VENV_PATH/bin/activate"
uvicorn main:app --reload --port 8000 --host 127.0.0.1 &
BACKEND_PID=$!

# Wait for backend to become available
echo "⏳ Waiting for backend to initialize..."
for i in {1..15}; do
    if curl -s http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
        echo "✅ Backend is healthy and ready!"
        break
    fi
    sleep 1
done

# 4. Start Frontend
echo "💻 [2/2] Starting Frontend (Next.js)..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=================================================="
echo "✨ FormFit AI is running!"
echo "👉 Web App: http://localhost:3000 (or http://localhost:3001)"
echo "👉 API Docs: http://127.0.0.1:8000/docs"
echo "Press [Ctrl + C] anytime to shut down both servers."
echo "=================================================="
echo ""

# Wait for background jobs
wait
