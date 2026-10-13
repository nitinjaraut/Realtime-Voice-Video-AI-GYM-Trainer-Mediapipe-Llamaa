"use client";

import GlassCard from "@/components/ui/GlassCard";
import MetricCard from "@/components/ui/MetricCard";
import type { PoseMetrics } from "@/hooks/useWebSocket";
import { type ExerciseType } from "@/lib/constants";

interface LiveMetricsProps {
  exercise: ExerciseType;
  metrics: PoseMetrics;
  targetReps: number;
  currentSet: number;
  targetSets: number;
}

export default function LiveMetrics({
  exercise,
  metrics,
  targetReps,
  currentSet,
  targetSets,
}: LiveMetricsProps) {
  const reps = metrics.reps || 0;

  // Choose accent color for reps based on progress
  let repAccent: "default" | "green" | "amber" | "red" = "default";
  if (reps >= targetReps) repAccent = "green";
  else if (reps > 0) repAccent = "amber";

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border-glass)]">
        <h3 className="text-lg font-bold gradient-text">{exercise}</h3>
        <span className="text-sm text-[var(--color-text-muted)]">
          Set {currentSet} of {targetSets}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <MetricCard
          label="Reps"
          value={`${reps} / ${targetReps}`}
          accent={repAccent}
          size="lg"
        />

        {/* Squats: show depth */}
        {exercise === "Squats" && metrics.depth_status && (
          <MetricCard
            label="Depth"
            value={metrics.depth_status}
            accent={metrics.depth_status === "GOOD DEPTH" ? "green" : metrics.depth_status === "STANDING" ? "blue" : "red"}
          />
        )}

        {/* Push-ups: show body alignment */}
        {exercise === "Push-ups" && metrics.body_alignment && (
          <MetricCard
            label="Alignment"
            value={metrics.body_alignment}
            accent={metrics.body_alignment === "Straight" ? "green" : "red"}
          />
        )}

        {/* Push-ups: show hip status — detector returns "LEVEL", "SAGGING", "PIKED UP" */}
        {exercise === "Push-ups" && metrics.hip_status && (
          <MetricCard
            label="Hips"
            value={metrics.hip_status}
            accent={metrics.hip_status === "LEVEL" ? "green" : "amber"}
          />
        )}

        {/* Bicep Curls: show swing — detector returns "NO SWING" or "SWINGING" */}
        {exercise === "Biceps Curls (Dumbbell)" && metrics.swing_status && (
          <MetricCard
            label="Torso"
            value={metrics.swing_status}
            accent={metrics.swing_status === "NO SWING" ? "green" : "red"}
          />
        )}

        {/* Bicep Curls: show elbow drift */}
        {exercise === "Biceps Curls (Dumbbell)" && metrics.shoulder_status && (
          <MetricCard
            label="Elbow"
            value={metrics.shoulder_status}
            accent={metrics.shoulder_status === "STABLE" ? "green" : "amber"}
          />
        )}

        {/* Shoulder Press: show back arch */}
        {exercise === "Shoulder Press" && metrics.back_arch_status && (
          <MetricCard
            label="Back"
            value={metrics.back_arch_status}
            accent={metrics.back_arch_status === "Neutral" ? "green" : "red"}
          />
        )}

        {/* Shoulder Press: show extension */}
        {exercise === "Shoulder Press" && metrics.extension_status && (
          <MetricCard
            label="Extension"
            value={metrics.extension_status}
            accent={metrics.extension_status === "FULL EXTENSION" ? "green" : "amber"}
          />
        )}

        {/* Lunges: show balance */}
        {exercise === "Lunges" && metrics.balance_status && (
          <MetricCard
            label="Balance"
            value={metrics.balance_status}
            accent={metrics.balance_status === "BALANCED" ? "green" : "red"}
          />
        )}
      </div>
    </GlassCard>
  );
}
