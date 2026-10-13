"use client";

import { EXERCISE_OPTIONS, type ExerciseType } from "@/lib/constants";

interface ExerciseSelectorProps {
  selected: ExerciseType;
  targetSets: number;
  targetReps: number;
  weight: number;
  onExerciseChange: (exercise: ExerciseType) => void;
  onSetsChange: (sets: number) => void;
  onRepsChange: (reps: number) => void;
  onWeightChange: (weight: number) => void;
  disabled?: boolean;
}

const exerciseIcons: Record<ExerciseType, string> = {
  "Squats": "🦵",
  "Push-ups": "💪",
  "Biceps Curls (Dumbbell)": "🏋️",
  "Shoulder Press": "🤸",
  "Lunges": "🚶",
};

export default function ExerciseSelector({
  selected,
  targetSets,
  targetReps,
  weight,
  onExerciseChange,
  onSetsChange,
  onRepsChange,
  onWeightChange,
  disabled = false,
}: ExerciseSelectorProps) {
  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
        Workout Plan
      </h3>

      {/* Exercise Selection */}
      <div className="grid grid-cols-1 gap-2">
        {EXERCISE_OPTIONS.map((ex) => (
          <button
            key={ex}
            disabled={disabled}
            onClick={() => onExerciseChange(ex)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-200 ${
              selected === ex
                ? "bg-[var(--color-accent-blue)]/15 border border-[var(--color-accent-blue)]/30 text-[var(--color-accent-blue)]"
                : "bg-white/3 border border-transparent text-[var(--color-text-muted)] hover:bg-white/5 hover:text-white"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className="text-lg">{exerciseIcons[ex]}</span>
            {ex}
          </button>
        ))}
      </div>

      {/* Sets / Reps / Weight */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[var(--color-text-dimmed)] mb-1">Sets</label>
          <input
            type="number"
            min={1}
            max={20}
            value={targetSets}
            onChange={(e) => onSetsChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full bg-white/5 border border-[var(--color-border-glass)] rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-[var(--color-accent-blue)]/50 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-dimmed)] mb-1">Reps</label>
          <input
            type="number"
            min={1}
            max={50}
            value={targetReps}
            onChange={(e) => onRepsChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full bg-white/5 border border-[var(--color-border-glass)] rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-[var(--color-accent-blue)]/50 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-text-dimmed)] mb-1">Weight (kg)</label>
          <input
            type="number"
            min={0}
            max={500}
            step={0.5}
            value={weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full bg-white/5 border border-[var(--color-border-glass)] rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-[var(--color-accent-blue)]/50 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
