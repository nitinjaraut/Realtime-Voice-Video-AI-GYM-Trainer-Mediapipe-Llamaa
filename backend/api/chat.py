"""
Chat API — RAG-powered fitness assistant with guardrails.

Pipeline:
  1. Guardrail: Is the question fitness-related?
  2. Retrieve: Query ChromaDB for relevant knowledge
  3. Generate: Pass context + question to Groq LLM
  4. Post-process: Add medical disclaimers if needed
  5. Fallback: Graceful handling of zero-retrieval and API errors
"""

import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

from services.rag.retriever import retrieve, format_context
from services.rag.guardrails import (
    is_fitness_related,
    needs_medical_disclaimer,
    get_out_of_domain_response,
    get_zero_retrieval_note,
    get_medical_disclaimer,
    truncate_context,
    build_rag_system_prompt,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


# ── Request / Response models ────────────────────────────────


class ChatRequest(BaseModel):
    question: str
    conversation_history: list[dict] = []  # [{"role": "user"|"assistant", "content": "..."}]


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    has_disclaimer: bool
    is_fallback: bool


# ── Helpers ──────────────────────────────────────────────────


def _get_groq_client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI Coach is temporarily unavailable. Please try again later.",
        )
    return Groq(api_key=api_key)


# ── Endpoint ─────────────────────────────────────────────────


@router.post("/ask", response_model=ChatResponse)
def ask_coach(req: ChatRequest):
    """
    Ask the AI fitness coach a question.
    Uses RAG with guardrails for production-ready responses.
    """
    question = req.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # ── Step 1: Guardrail — out-of-domain check ──────────
    if not is_fitness_related(question):
        return ChatResponse(
            answer=get_out_of_domain_response(),
            sources=[],
            has_disclaimer=False,
            is_fallback=False,
        )

    # ── Step 2: Retrieve relevant context from ChromaDB ──
    try:
        chunks = retrieve(question, top_k=3)
    except Exception as e:
        logger.error(f"ChromaDB retrieval failed: {e}")
        chunks = []

    has_context = len(chunks) > 0
    is_fallback = not has_context

    # Format and truncate context
    context = format_context(chunks) if has_context else ""
    context = truncate_context(context)

    sources = list(set(c["source"].replace("_", " ").title() for c in chunks))

    # ── Step 3: Generate response via Groq LLM ──────────
    system_prompt = build_rag_system_prompt(context, has_context)

    # Add zero-retrieval note to the user prompt if no context
    user_prompt = question
    if is_fallback:
        user_prompt = f"{question}\n\n[Note: {get_zero_retrieval_note()}]"

    messages = [
        {"role": "system", "content": system_prompt},
    ]

    # Include conversation history (last 6 messages max)
    for msg in req.conversation_history[-6:]:
        if msg.get("role") in ("user", "assistant"):
            messages.append(msg)

    messages.append({"role": "user", "content": user_prompt})

    # Try models in order of preference, within Groq's rate limits (max_tokens=700 <= 1000 OTPM limit)
    candidate_models = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
    client = _get_groq_client()
    answer = None
    last_error = None

    for model_name in candidate_models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.3,
                max_tokens=700,
            )
            answer = response.choices[0].message.content.strip()
            if answer:
                break
        except Exception as e:
            last_error = e
            logger.warning(f"Model {model_name} failed: {e}. Trying next candidate...")

    if not answer:
        logger.error(f"All Groq LLM candidates failed. Last error: {last_error}")
        return ChatResponse(
            answer=(
                "🏋️ The AI Coach is catching its breath! "
                "Please try again in a moment. If the issue persists, "
                "check your internet connection."
            ),
            sources=[],
            has_disclaimer=False,
            is_fallback=True,
        )

    # ── Step 4: Post-process — add medical disclaimer ────
    has_disclaimer = needs_medical_disclaimer(question)
    if has_disclaimer:
        answer = get_medical_disclaimer() + answer

    return ChatResponse(
        answer=answer,
        sources=sources,
        has_disclaimer=has_disclaimer,
        is_fallback=is_fallback,
    )
