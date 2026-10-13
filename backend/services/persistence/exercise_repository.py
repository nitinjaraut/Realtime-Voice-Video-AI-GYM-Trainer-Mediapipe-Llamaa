"""
Database layer — adapted from Streamlit version for FastAPI.
Uses a module-level connection instead of st.cache_resource.
"""

import sqlite3
import threading
from pathlib import Path

_DB_PATH = str(Path(__file__).resolve().parent.parent.parent / "data.db")
_lock = threading.Lock()
_connection: sqlite3.Connection | None = None


def _get_connection() -> sqlite3.Connection:
    global _connection
    if _connection is None:
        _connection = sqlite3.connect(_DB_PATH, check_same_thread=False)
        _connection.row_factory = sqlite3.Row
        _connection.execute("PRAGMA journal_mode=WAL")
    return _connection


def init_db() -> None:
    conn = _get_connection()

    with _lock, conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                username   TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS exercises (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          INTEGER NOT NULL REFERENCES users(id),
                exercise_name    TEXT    NOT NULL,
                reps             INTEGER NOT NULL DEFAULT 0,
                sets             INTEGER NOT NULL DEFAULT 0,
                weight           REAL    DEFAULT 0,
                duration_seconds INTEGER NOT NULL DEFAULT 0,
                form_score       INTEGER DEFAULT NULL,
                rep_quality      TEXT    DEFAULT NULL,
                fatigue_score    INTEGER DEFAULT NULL,
                created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS set_details (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                exercise_id  INTEGER NOT NULL REFERENCES exercises(id),
                set_number   INTEGER NOT NULL,
                reps         INTEGER NOT NULL DEFAULT 0,
                form_score   INTEGER DEFAULT NULL,
                avg_speed    REAL    DEFAULT NULL,
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


# ── User operations ──────────────────────────────────────────


def get_user(username: str) -> dict | None:
    conn = _get_connection()
    with _lock:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()
    return dict(row) if row else None


def create_user(username: str) -> dict:
    conn = _get_connection()
    with _lock, conn:
        conn.execute("INSERT INTO users (username) VALUES (?)", (username,))
    return get_user(username)


def get_or_create_user(username: str) -> dict:
    user = get_user(username)
    if user is None:
        user = create_user(username)
    return user


# ── Exercise / workout operations ────────────────────────────


def add_exercise(
    user_id: int,
    exercise_name: str,
    reps: int,
    sets: int,
    duration_seconds: int,
    weight: float = 0,
    form_score: int | None = None,
    rep_quality: str | None = None,
    fatigue_score: int | None = None,
) -> int:
    """Insert a new exercise record and return its id."""
    conn = _get_connection()
    with _lock, conn:
        cursor = conn.execute(
            """
            INSERT INTO exercises
                (user_id, exercise_name, reps, sets, weight,
                 duration_seconds, form_score, rep_quality, fatigue_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id, exercise_name, reps, sets, weight,
                duration_seconds, form_score, rep_quality, fatigue_score,
            ),
        )
        return cursor.lastrowid


def add_set_detail(
    exercise_id: int,
    set_number: int,
    reps: int,
    form_score: int | None = None,
    avg_speed: float | None = None,
) -> None:
    conn = _get_connection()
    with _lock, conn:
        conn.execute(
            """
            INSERT INTO set_details
                (exercise_id, set_number, reps, form_score, avg_speed)
            VALUES (?, ?, ?, ?, ?)
            """,
            (exercise_id, set_number, reps, form_score, avg_speed),
        )


def get_user_exercises(user_id: int) -> list[dict]:
    conn = _get_connection()
    with _lock:
        rows = conn.execute(
            "SELECT * FROM exercises WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def get_user_exercises_in_range(
    user_id: int, start_date: str, end_date: str
) -> list[dict]:
    conn = _get_connection()
    with _lock:
        rows = conn.execute(
            """
            SELECT * FROM exercises
            WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?
            ORDER BY created_at DESC
            """,
            (user_id, start_date, end_date),
        ).fetchall()
    return [dict(r) for r in rows]


def get_exercise_set_details(exercise_id: int) -> list[dict]:
    conn = _get_connection()
    with _lock:
        rows = conn.execute(
            "SELECT * FROM set_details WHERE exercise_id = ? ORDER BY set_number",
            (exercise_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def get_daily_summary(user_id: int, days: int = 90) -> list[dict]:
    """Aggregate daily workout data for the heatmap and charts."""
    conn = _get_connection()
    with _lock:
        rows = conn.execute(
            """
            SELECT
                DATE(created_at) as date,
                GROUP_CONCAT(DISTINCT exercise_name) as exercises,
                SUM(reps) as total_reps,
                SUM(sets) as total_sets,
                SUM(duration_seconds) as total_duration,
                AVG(form_score) as avg_form_score,
                AVG(fatigue_score) as avg_fatigue_score,
                COUNT(*) as workout_count
            FROM exercises
            WHERE user_id = ? AND created_at >= DATE('now', ?)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
            """,
            (user_id, f"-{days} days"),
        ).fetchall()
    return [dict(r) for r in rows]


def get_exercise_progress(user_id: int, exercise_name: str) -> list[dict]:
    """Get per-exercise progress over time for trend charts."""
    conn = _get_connection()
    with _lock:
        rows = conn.execute(
            """
            SELECT
                DATE(created_at) as date,
                SUM(reps) as total_reps,
                SUM(sets) as total_sets,
                AVG(form_score) as avg_form_score,
                AVG(weight) as avg_weight,
                SUM(reps * sets) as volume
            FROM exercises
            WHERE user_id = ? AND exercise_name = ?
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
            """,
            (user_id, exercise_name),
        ).fetchall()
    return [dict(r) for r in rows]


def get_latest_fatigue(user_id: int) -> int | None:
    """Get the most recent fatigue score."""
    conn = _get_connection()
    with _lock:
        row = conn.execute(
            """
            SELECT fatigue_score FROM exercises
            WHERE user_id = ? AND fatigue_score IS NOT NULL
            ORDER BY created_at DESC LIMIT 1
            """,
            (user_id,),
        ).fetchone()
    return row["fatigue_score"] if row else None


def get_form_scores_by_exercise(user_id: int) -> dict[str, float]:
    """Get average form score per exercise for the radar chart."""
    conn = _get_connection()
    with _lock:
        rows = conn.execute(
            """
            SELECT exercise_name, AVG(form_score) as avg_score
            FROM exercises
            WHERE user_id = ? AND form_score IS NOT NULL
            GROUP BY exercise_name
            """,
            (user_id,),
        ).fetchall()
    return {r["exercise_name"]: round(r["avg_score"], 1) for r in rows}
