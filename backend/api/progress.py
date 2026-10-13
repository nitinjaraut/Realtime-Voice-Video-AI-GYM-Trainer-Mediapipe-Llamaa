"""Progress API — aggregated data for the analytics dashboard."""

from fastapi import APIRouter
from services.persistence.exercise_repository import (
    get_daily_summary,
    get_exercise_progress,
    get_latest_fatigue,
    get_form_scores_by_exercise,
    get_user_exercises,
)
from services.config.workout_config import EXERCISE_OPTIONS

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/{user_id}/dashboard")
def get_dashboard_data(user_id: int, days: int = 90):
    """
    Return all data needed to render the dashboard in a single call:
    - Latest fatigue score
    - Daily activity summary (for heatmap)
    - Per-exercise form scores (for radar chart)
    - Recent workout summary
    """
    daily = get_daily_summary(user_id, days)
    fatigue = get_latest_fatigue(user_id)
    form_scores = get_form_scores_by_exercise(user_id)

    # Build radar data with all exercises (default to 0 if no data)
    radar_data = []
    for ex in EXERCISE_OPTIONS:
        radar_data.append({
            "exercise": ex,
            "score": form_scores.get(ex, 0),
        })

    return {
        "fatigue_score": fatigue or 0,
        "daily_summary": daily,
        "radar_data": radar_data,
    }


@router.get("/{user_id}/trends/{exercise_name}")
def get_exercise_trends(user_id: int, exercise_name: str):
    """Return time-series data for a specific exercise's progress chart."""
    return get_exercise_progress(user_id, exercise_name)


@router.get("/{user_id}/stats")
def get_overall_stats(user_id: int):
    """Return high-level stats: total workouts, total reps, avg form score."""
    workouts = get_user_exercises(user_id)

    if not workouts:
        return {
            "total_workouts": 0,
            "total_reps": 0,
            "total_sets": 0,
            "avg_form_score": None,
            "total_duration_minutes": 0,
            "exercises_practiced": 0,
        }

    total_reps = sum(w.get("reps", 0) for w in workouts)
    total_sets = sum(w.get("sets", 0) for w in workouts)
    total_duration = sum(w.get("duration_seconds", 0) or 0 for w in workouts)

    form_scores = [w["form_score"] for w in workouts if w.get("form_score") is not None]
    avg_form = round(sum(form_scores) / len(form_scores), 1) if form_scores else None

    exercises = set(w["exercise_name"] for w in workouts)

    return {
        "total_workouts": len(workouts),
        "total_reps": total_reps,
        "total_sets": total_sets,
        "avg_form_score": avg_form,
        "total_duration_minutes": round(total_duration / 60, 1),
        "exercises_practiced": len(exercises),
    }
