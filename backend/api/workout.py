"""Workout API — CRUD for exercise sessions and set details."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.persistence.exercise_repository import (
    add_exercise,
    add_set_detail,
    get_user_exercises,
    get_exercise_set_details,
)
from fatigue.estimator import estimate_fatigue

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


# ── Request / Response models ────────────────────────────────


class SetDetailInput(BaseModel):
    set_number: int
    reps: int
    form_score: int | None = None
    avg_speed: float | None = None


class SaveWorkoutRequest(BaseModel):
    user_id: int
    exercise_name: str
    total_reps: int
    total_sets: int
    weight: float = 0
    duration_seconds: int = 0
    form_score: int | None = None
    rep_quality: str | None = None
    rpe: float | None = None
    set_details: list[SetDetailInput] = []


class WorkoutResponse(BaseModel):
    id: int
    exercise_name: str
    reps: int
    sets: int
    weight: float
    duration_seconds: int
    form_score: int | None
    rep_quality: str | None
    fatigue_score: int | None
    created_at: str


class SaveWorkoutResponse(BaseModel):
    exercise_id: int
    fatigue_score: int
    message: str


# ── Endpoints ────────────────────────────────────────────────


@router.post("/save", response_model=SaveWorkoutResponse)
def save_workout(req: SaveWorkoutRequest):
    """Save a completed workout session with optional per-set details."""

    # Calculate fatigue score
    first_set_score = None
    last_set_score = None

    if req.set_details:
        scores = [s.form_score for s in req.set_details if s.form_score is not None]
        if scores:
            first_set_score = scores[0]
            last_set_score = scores[-1]

    fatigue_score = estimate_fatigue(
        exercise_name=req.exercise_name,
        total_reps=req.total_reps,
        total_sets=req.total_sets,
        weight=req.weight,
        duration_seconds=req.duration_seconds,
        first_set_form_score=first_set_score,
        last_set_form_score=last_set_score,
        rpe=req.rpe,
    )

    # Save the main exercise record
    exercise_id = add_exercise(
        user_id=req.user_id,
        exercise_name=req.exercise_name,
        reps=req.total_reps,
        sets=req.total_sets,
        weight=req.weight,
        duration_seconds=req.duration_seconds,
        form_score=req.form_score,
        rep_quality=req.rep_quality,
        fatigue_score=fatigue_score,
    )

    # Save per-set details
    for sd in req.set_details:
        add_set_detail(
            exercise_id=exercise_id,
            set_number=sd.set_number,
            reps=sd.reps,
            form_score=sd.form_score,
            avg_speed=sd.avg_speed,
        )

    return SaveWorkoutResponse(
        exercise_id=exercise_id,
        fatigue_score=fatigue_score,
        message="Workout saved successfully.",
    )


@router.get("/{user_id}", response_model=list[WorkoutResponse])
def get_workouts(user_id: int):
    """Get all workouts for a user."""
    rows = get_user_exercises(user_id)

    return [
        WorkoutResponse(
            id=r["id"],
            exercise_name=r["exercise_name"],
            reps=r["reps"],
            sets=r["sets"],
            weight=r.get("weight", 0) or 0,
            duration_seconds=r.get("duration_seconds", 0) or 0,
            form_score=r.get("form_score"),
            rep_quality=r.get("rep_quality"),
            fatigue_score=r.get("fatigue_score"),
            created_at=str(r["created_at"]),
        )
        for r in rows
    ]


@router.get("/sets/{exercise_id}")
def get_sets(exercise_id: int):
    """Get per-set breakdown for a specific workout."""
    return get_exercise_set_details(exercise_id)
