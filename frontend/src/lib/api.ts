import { API } from "./constants";

/**
 * Generic fetch wrapper with error handling.
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Auth ────────────────────────────────────────────────────

export interface User {
  user_id: number;
  username: string;
}

export async function login(username: string): Promise<User> {
  return request<User>(API.AUTH_LOGIN, {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

// ── Workouts ────────────────────────────────────────────────

export interface Workout {
  id: number;
  exercise_name: string;
  reps: number;
  sets: number;
  weight: number;
  duration_seconds: number;
  form_score: number | null;
  rep_quality: string | null;
  fatigue_score: number | null;
  created_at: string;
}

export interface SaveWorkoutPayload {
  user_id: number;
  exercise_name: string;
  total_reps: number;
  total_sets: number;
  weight?: number;
  duration_seconds?: number;
  form_score?: number;
  rep_quality?: string;
  rpe?: number;
  set_details?: Array<{
    set_number: number;
    reps: number;
    form_score?: number;
    avg_speed?: number;
  }>;
}

export interface SaveWorkoutResponse {
  exercise_id: number;
  fatigue_score: number;
  message: string;
}

export async function saveWorkout(data: SaveWorkoutPayload): Promise<SaveWorkoutResponse> {
  return request<SaveWorkoutResponse>(API.WORKOUTS_SAVE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getWorkouts(userId: number): Promise<Workout[]> {
  return request<Workout[]>(API.WORKOUTS(userId));
}

// ── Progress / Dashboard ────────────────────────────────────

export interface DailySummary {
  date: string;
  exercises: string;
  total_reps: number;
  total_sets: number;
  total_duration: number;
  avg_form_score: number | null;
  avg_fatigue_score: number | null;
  workout_count: number;
}

export interface RadarDataPoint {
  exercise: string;
  score: number;
}

export interface DashboardData {
  fatigue_score: number;
  daily_summary: DailySummary[];
  radar_data: RadarDataPoint[];
}

export interface OverallStats {
  total_workouts: number;
  total_reps: number;
  total_sets: number;
  avg_form_score: number | null;
  total_duration_minutes: number;
  exercises_practiced: number;
}

export async function getDashboardData(userId: number, days = 90): Promise<DashboardData> {
  return request<DashboardData>(API.DASHBOARD(userId, days));
}

export async function getOverallStats(userId: number): Promise<OverallStats> {
  return request<OverallStats>(API.STATS(userId));
}

export async function getExerciseTrends(userId: number, exercise: string) {
  return request<Array<{
    date: string;
    total_reps: number;
    total_sets: number;
    avg_form_score: number | null;
    avg_weight: number | null;
    volume: number;
  }>>(API.TRENDS(userId, exercise));
}

// ── Chat (RAG) ──────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  has_disclaimer: boolean;
  is_fallback: boolean;
}

export async function askCoach(
  question: string,
  history: ChatMessage[] = []
): Promise<ChatResponse> {
  return request<ChatResponse>(API.CHAT, {
    method: "POST",
    body: JSON.stringify({ question, conversation_history: history }),
  });
}
