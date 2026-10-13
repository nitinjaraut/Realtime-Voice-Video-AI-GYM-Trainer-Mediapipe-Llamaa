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
    # Workout splits & programs
    "split", "splits", "spilt", "spilts", "ppl", "push pull", "push-pull",
    "routine", "routines", "program", "programs", "programme", "schedule",
    "bro split", "arnold split", "upper lower", "full body", "calisthenics",
    "hiit", "crossfit", "circuit", "tabata", "amrap", "emom",

    # Exercises & movements
    "exercise", "exercises", "workout", "workouts", "gym", "lift", "lifting",
    "squat", "squats", "pushup", "push-up", "pushups", "push-ups",
    "pullup", "pull-up", "pullups", "pull-ups", "chinup", "chin-up",
    "curl", "curls", "press", "presses", "bench press", "bench",
    "overhead press", "shoulder press", "deadlift", "deadlifts",
    "lunge", "lunges", "dip", "dips", "plank", "planks", "row", "rows",
    "lateral raise", "shrug", "crunch", "crunches", "extension", "fly", "flys",

    # Training principles & metrics
    "rep", "reps", "repetition", "set", "sets", "weight", "weights",
    "dumbbell", "dumbbells", "barbell", "barbells", "kettlebell", "kettlebells",
    "machine", "cable", "plates", "form", "technique", "depth", "alignment",
    "range of motion", "rom", "hypertrophy", "progressive overload", "overload",
    "volume", "intensity", "failure", "rpe", "rir", "1rm", "one rep max",
    "superset", "drop set", "dropset", "rest pause", "tempo", "deload",
    "frequency", "aerobic", "anaerobic", "cardio", "endurance", "strength",
    "muscle", "muscles", "hypertrophic",

    # Anatomy & Muscle Groups
    "bicep", "biceps", "tricep", "triceps", "chest", "pec", "pecs",
    "back", "lat", "lats", "trap", "traps", "shoulder", "shoulders",
    "delt", "delts", "leg", "legs", "quad", "quads", "hamstring", "hamstrings",
    "glute", "glutes", "calf", "calves", "core", "abs", "abdominal",
    "obliques", "forearm", "forearms", "hip", "hips", "knee", "knees",
    "ankle", "ankles", "wrist", "wrists", "elbow", "elbows", "spine", "lumbar",

    # Nutrition, Body composition & Supplements
    "protein", "carb", "carbs", "carbohydrate", "fat", "fats", "calorie", "calories",
    "nutrition", "diet", "macros", "meal", "meals", "water", "hydration",
    "creatine", "supplement", "supplements", "whey", "casein", "isolate",
    "bcaa", "pre-workout", "preworkout", "caffeine", "bulk", "bulking",
    "cut", "cutting", "deficit", "surplus", "lean", "fat loss", "weight loss",
    "muscle gain", "body recomposition", "tone", "toning",

    # Recovery, Health & Safety
    "recovery", "recover", "rest", "rest day", "sleep", "soreness", "doms",
    "fatigue", "overtraining", "tired", "exhaustion", "warmup", "warm up",
    "warm-up", "cooldown", "cool down", "cool-down", "stretch", "stretching",
    "mobility", "flexibility", "foam roll", "injury", "pain", "hurt", "sore",
    "strain", "sprain", "posture", "breathing", "fitness", "health", "trainer",
    "coach", "bodybuilding", "powerlifting", "physique",
}

_EXPLICIT_OFF_TOPIC_KEYWORDS = {
    "python", "javascript", "typescript", "c++", "java", "coding", "software",
    "debug", "git", "docker", "kubernetes", "sql", "linux", "html", "css",
    "crypto", "bitcoin", "ethereum", "stock price", "stock market",
    "election", "president", "politics", "congress", "senate",
    "movie plot", "box office", "actor", "actress",
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
    Uses positive keyword matching + off-topic exclusions.
    """
    query_lower = query.lower()

    # Reject obvious off-topic categories (coding, politics, crypto, etc.)
    for off_topic in _EXPLICIT_OFF_TOPIC_KEYWORDS:
        if off_topic in query_lower:
            return False

    # Direct keyword match against comprehensive fitness vocabulary
    for keyword in _FITNESS_KEYWORDS:
        if keyword in query_lower:
            return True

    # Check common sub-words or variations
    words = re.findall(r"\b\w+\b", query_lower)
    for w in words:
        if w in _FITNESS_KEYWORDS:
            return True

    # Very short queries (greetings, simple questions) give benefit of the doubt
    if len(words) <= 4:
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
        "You are FormFit AI Coach, a knowledgeable, encouraging, and elite personal fitness coach. "
        "You guide users on workout routines and splits (such as PPL, Upper/Lower, Full Body, Bro Split), "
        "exercise technique, rep ranges, nutrition, injury prevention, and recovery.\n\n"
        "Guidelines:\n"
        "- Be actionable, motivating, and clear. Format responses with neat paragraphs, bold headings, or bullet points.\n"
        "- When asked about workout splits or routines, clearly explain how the split works, the recommended day-by-day schedule, which muscles are trained together, and who benefits most.\n"
        "- Always prioritize safe form, progressive overload, and adequate rest.\n"
        "- Never prescribe specific medications or provide formal medical diagnoses.\n"
        "- If a user asks a question completely unrelated to fitness, gym, sports, or health, "
        "politely let them know you specialize in fitness and training, and suggest fitness topics they can ask about.\n"
    )

    if has_context:
        base += (
            "\nYou have been provided with relevant information from our verified "
            "fitness knowledge base. Use this context to give an accurate, detailed answer. "
            "You may supplement with your deep fitness knowledge as needed.\n\n"
            f"### Retrieved Context\n{context}\n"
        )
    else:
        base += (
            "\nProvide a comprehensive, high-quality response based on established fitness "
            "and exercise science principles.\n"
        )

    return base
