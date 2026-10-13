"""
RAG Guardrails — production-ready safety and edge-case handling.

Handles:
1. Out-of-domain queries (politics, coding, etc.)
2. Medical/injury disclaimer injection
3. Zero-retrieval fallback messaging
4. Token/context overflow prevention
5. Response sanitization
"""

import re

# ── Keywords & patterns ──────────────────────────────────────

_FITNESS_KEYWORDS = {
    "exercise", "workout", "gym", "muscle", "squat", "push-up", "pushup",
    "curl", "press", "lunge", "rep", "set", "form", "weight", "dumbbell",
    "barbell", "bench", "deadlift", "plank", "stretch", "warm up", "cool down",
    "protein", "nutrition", "diet", "calorie", "carb", "fat", "meal",
    "recovery", "rest", "sleep", "soreness", "fatigue", "overtraining",
    "strength", "endurance", "cardio", "flexibility", "mobility",
    "pain", "injury", "hurt", "knee", "back", "shoulder", "wrist",
    "posture", "alignment", "angle", "depth", "range of motion",
    "beginner", "intermediate", "training", "fitness", "health",
    "creatine", "supplement", "hydration", "water",
    "bicep", "tricep", "chest", "leg", "core", "abs", "glute",
    "body", "breathing", "technique",
}

_MEDICAL_KEYWORDS = {
    "pain", "injury", "hurt", "hurts", "hurting", "injured", "swollen",
    "swelling", "torn", "tear", "fracture", "broken", "sprain", "strain",
    "doctor", "hospital", "surgery", "medical", "diagnosis", "treatment",
    "chronic", "acute", "inflammation", "numbness", "tingling",
    "physical therapy", "physiotherapy", "medication", "pill",
}

_OUT_OF_DOMAIN_RESPONSE = (
    "I'm your FormFit AI fitness coach! I can only help with topics related to "
    "exercise form, workout routines, fitness nutrition, injury prevention, and "
    "recovery. Could you rephrase your question about one of these topics?"
)

_MEDICAL_DISCLAIMER = (
    "⚠️ **Important Disclaimer**: I'm an AI fitness assistant, not a medical "
    "professional. For any pain, injury, or health concern, please consult a "
    "qualified doctor or physical therapist. The following is general fitness "
    "information only:\n\n"
)

_ZERO_RETRIEVAL_NOTE = (
    "I don't have specific information about that in my fitness knowledge base. "
    "Here's a general response based on common fitness guidelines — but please "
    "verify with a certified trainer or reputable source:"
)

_MAX_CONTEXT_CHARS = 3000  # Roughly ~750 tokens


# ── Public API ───────────────────────────────────────────────


def is_fitness_related(query: str) -> bool:
    """
    Check if the user's query is related to fitness/health/nutrition.
    Uses keyword matching + a generous heuristic to avoid false negatives.
    """
    query_lower = query.lower()

    # Direct keyword match
    for keyword in _FITNESS_KEYWORDS:
        if keyword in query_lower:
            return True

    # Very short queries are ambiguous — give benefit of the doubt
    if len(query.split()) <= 3:
        return True

    return False


def needs_medical_disclaimer(query: str) -> bool:
    """Check if the query involves medical/injury concerns."""
    query_lower = query.lower()

    for keyword in _MEDICAL_KEYWORDS:
        if keyword in query_lower:
            return True

    return False


def get_out_of_domain_response() -> str:
    """Return the out-of-domain rejection message."""
    return _OUT_OF_DOMAIN_RESPONSE


def get_zero_retrieval_note() -> str:
    """Return the zero-retrieval fallback message."""
    return _ZERO_RETRIEVAL_NOTE


def get_medical_disclaimer() -> str:
    """Return the medical disclaimer prefix."""
    return _MEDICAL_DISCLAIMER


def truncate_context(context: str) -> str:
    """
    Truncate context to prevent token overflow.
    Cuts at paragraph boundaries to avoid mid-sentence truncation.
    """
    if len(context) <= _MAX_CONTEXT_CHARS:
        return context

    truncated = context[:_MAX_CONTEXT_CHARS]

    # Cut at the last complete paragraph
    last_break = truncated.rfind("\n\n")
    if last_break > _MAX_CONTEXT_CHARS // 2:
        truncated = truncated[:last_break]

    return truncated.strip() + "\n\n[... additional context truncated for brevity]"


def build_rag_system_prompt(context: str, has_context: bool) -> str:
    """
    Build the system prompt for the RAG LLM call.
    Varies based on whether we retrieved relevant context or not.
    """
    base = (
        "You are FormFit AI Coach, a knowledgeable and friendly fitness assistant. "
        "You help beginners and intermediate gym users with exercise form, workout "
        "routines, nutrition, injury prevention, and recovery.\n\n"
        "Guidelines:\n"
        "- Be concise but thorough. Aim for 2-4 paragraph responses.\n"
        "- Use bullet points for lists of tips or steps.\n"
        "- Always prioritize safety. If something could be dangerous, say so.\n"
        "- Never provide specific medical diagnoses or treatment plans.\n"
        "- If you're unsure, say so honestly rather than guessing.\n"
        "- Reference the provided context when available.\n"
    )

    if has_context:
        base += (
            "\nYou have been provided with relevant information from a curated "
            "fitness knowledge base. Base your answer primarily on this context. "
            "If the context doesn't fully answer the question, you may supplement "
            "with general fitness knowledge, but indicate which parts come from "
            "your general knowledge.\n\n"
            f"### Retrieved Context\n{context}\n"
        )
    else:
        base += (
            "\nNo specific context was retrieved from the knowledge base for this "
            "question. Provide a helpful answer based on general, well-established "
            "fitness knowledge. Be transparent that this is general guidance.\n"
        )

    return base
