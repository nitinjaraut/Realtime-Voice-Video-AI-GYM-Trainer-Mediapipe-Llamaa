"""
FormFit AI — FastAPI Backend Entry Point

Mounts all API routers, WebSocket endpoint, initializes DB and RAG on startup.
"""

import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth import router as auth_router
from api.workout import router as workout_router
from api.progress import router as progress_router
from api.chat import router as chat_router
from ws.pose_stream import router as pose_router
from services.persistence.exercise_repository import init_db
from services.rag.knowledge_loader import load_knowledge_base

# ── Load environment variables ───────────────────────────────

load_dotenv()

# ── Logging ──────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run initialization on startup."""
    logger.info("🚀 Initializing FormFit AI backend...")

    # Initialize database
    init_db()
    logger.info("✅ Database initialized")

    # Load RAG knowledge base into ChromaDB
    try:
        collection = load_knowledge_base()
        logger.info(f"✅ RAG knowledge base loaded ({collection.count()} chunks)")
    except Exception as e:
        logger.warning(f"⚠️ RAG knowledge base failed to load: {e}")

    logger.info("🏋️ FormFit AI backend is ready!")

    yield

    logger.info("👋 Shutting down FormFit AI backend...")


# ── FastAPI app ──────────────────────────────────────────────

app = FastAPI(
    title="FormFit AI",
    description="AI-Powered Fitness and Exercise Monitoring System",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS middleware (allow Next.js frontend) ─────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(workout_router)
app.include_router(progress_router)
app.include_router(chat_router)
app.include_router(pose_router)


# ── Health check ─────────────────────────────────────────────


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "FormFit AI Backend"}
