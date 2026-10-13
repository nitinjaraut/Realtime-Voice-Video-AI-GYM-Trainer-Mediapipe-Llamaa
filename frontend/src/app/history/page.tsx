"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getWorkouts, type Workout } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadWorkouts() {
      if (!user) return;
      try {
        const data = await getWorkouts(user.user_id);
        setWorkouts(data);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkouts();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-[var(--color-accent-blue)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Workout History</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Review your past performances.</p>
      </header>

      {workouts.length === 0 ? (
        <GlassCard className="text-center p-12">
          <span className="text-4xl mb-4 block">👻</span>
          <h2 className="text-xl font-bold mb-2">No workouts yet</h2>
          <p className="text-[var(--color-text-muted)]">
            Head over to the Workout Studio to start tracking your first session.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workouts.map((workout) => (
            <GlassCard key={workout.id} hoverable className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{workout.exercise_name}</h3>
                <span className="text-xs text-[var(--color-text-dimmed)]">
                  {new Date(workout.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-[var(--color-text-dimmed)] block text-xs">Volume</span>
                  <span className="font-medium">{workout.sets} sets × {workout.reps} reps</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-dimmed)] block text-xs">Weight</span>
                  <span className="font-medium">{workout.weight || 0} kg</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-dimmed)] block text-xs">Form</span>
                  <span className={`font-medium ${
                    !workout.form_score ? "" : 
                    workout.form_score >= 80 ? "text-[var(--color-accent-green)]" : 
                    workout.form_score >= 60 ? "text-[var(--color-accent-amber)]" : 
                    "text-[var(--color-accent-red)]"
                  }`}>
                    {workout.form_score ? `${workout.form_score}%` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-dimmed)] block text-xs">Fatigue</span>
                  <span className="font-medium">
                    {workout.fatigue_score ? `${workout.fatigue_score}/100` : "N/A"}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
