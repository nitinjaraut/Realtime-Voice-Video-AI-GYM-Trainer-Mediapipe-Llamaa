const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export const API = {
  AUTH_LOGIN: `${API_BASE}/api/auth/login`,
  WORKOUTS_SAVE: `${API_BASE}/api/workouts/save`,
  WORKOUTS: (userId: number) => `${API_BASE}/api/workouts/${userId}`,
  WORKOUT_SETS: (exerciseId: number) => `${API_BASE}/api/workouts/sets/${exerciseId}`,
  DASHBOARD: (userId: number, days?: number) =>
    `${API_BASE}/api/progress/${userId}/dashboard${days ? `?days=${days}` : ""}`,
  TRENDS: (userId: number, exercise: string) =>
    `${API_BASE}/api/progress/${userId}/trends/${encodeURIComponent(exercise)}`,
  STATS: (userId: number) => `${API_BASE}/api/progress/${userId}/stats`,
  CHAT: `${API_BASE}/api/chat/ask`,
  HEALTH: `${API_BASE}/api/health`,
  WS_POSE: `${WS_BASE}/ws/pose`,
};

export const EXERCISE_OPTIONS = [
  "Squats",
  "Push-ups",
  "Biceps Curls (Dumbbell)",
  "Shoulder Press",
  "Lunges",
] as const;

export type ExerciseType = (typeof EXERCISE_OPTIONS)[number];
