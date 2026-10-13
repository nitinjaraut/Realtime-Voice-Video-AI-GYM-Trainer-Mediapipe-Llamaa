"""
Fatigue Estimation Algorithm

Calculates a training-fatigue score (0–100) using:
  - Session volume  (sets × reps × weight)
  - Session duration
  - Form degradation (drop in form score across sets)
  - Exercise difficulty multiplier
  - User-provided RPE (Rate of Perceived Exertion, optional)

This is an *indicator*, NOT a medical measurement.
"""

from services.config.workout_config import EXERCISE_DIFFICULTY


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _normalize(value: float, low: float, high: float) -> float:
    """Map value into 0–100 given expected [low, high] range."""
    if high <= low:
        return 0.0
    return _clamp((value - low) / (high - low) * 100)


def estimate_fatigue(
    exercise_name: str,
    total_reps: int,
    total_sets: int,
    weight: float = 0,
    duration_seconds: int = 0,
    first_set_form_score: int | None = None,
    last_set_form_score: int | None = None,
    rpe: float | None = None,
) -> int:
    """
    Return an estimated fatigue score between 0 and 100.

    Weight factors:
      volume_factor           30 %
      duration_factor         20 %
      form_degradation_factor 20 %
      difficulty_factor       15 %
      rpe_factor              15 %
    """

    # ── Volume factor ────────────────────────────────────────
    # Rough heuristic: 0 volume → 0, ~3000+ effective volume → 100
    effective_weight = max(weight, 1.0)  # bodyweight exercises count as 1
    volume = total_reps * total_sets * effective_weight
    volume_factor = _normalize(volume, 0, 3000)

    # ── Duration factor ──────────────────────────────────────
    # 0 min → 0, ≥60 min → 100
    duration_factor = _normalize(duration_seconds, 0, 3600)

    # ── Form degradation factor ──────────────────────────────
    # If the form score dropped from first set to last set, fatigue is higher
    if (
        first_set_form_score is not None
        and last_set_form_score is not None
        and first_set_form_score > 0
    ):
        drop = max(0, first_set_form_score - last_set_form_score)
        form_degradation_factor = _normalize(drop, 0, 40)
    else:
        form_degradation_factor = 30.0  # neutral default

    # ── Difficulty factor ────────────────────────────────────
    multiplier = EXERCISE_DIFFICULTY.get(exercise_name, 1.0)
    difficulty_factor = _normalize(multiplier, 0.5, 1.5)

    # ── RPE factor ───────────────────────────────────────────
    if rpe is not None:
        rpe_factor = _normalize(rpe, 1, 10)
    else:
        rpe_factor = 50.0  # neutral default when user doesn't provide RPE

    # ── Weighted sum ─────────────────────────────────────────
    fatigue = (
        0.30 * volume_factor
        + 0.20 * duration_factor
        + 0.20 * form_degradation_factor
        + 0.15 * difficulty_factor
        + 0.15 * rpe_factor
    )

    return int(_clamp(fatigue))
