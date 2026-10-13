"use client";

import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import type { RadarDataPoint } from "@/lib/api";

interface FormRadarChartProps {
  data: RadarDataPoint[];
}

export default function FormRadarChart({ data }: FormRadarChartProps) {
  // Shorten exercise names for the radar labels
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.exercise
      .replace("Biceps Curls (Dumbbell)", "Curls")
      .replace("Shoulder Press", "Press"),
  }));

  const hasData = data.some((d) => d.score > 0);

  if (!hasData) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center h-64">
        <span className="text-4xl mb-3">🎯</span>
        <p className="text-[var(--color-text-dimmed)] text-sm text-center">
          Complete workouts with form tracking<br />to see your skill radar
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
        Form Quality by Exercise
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <RechartsRadar data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid
            gridType="polygon"
            stroke="rgba(255,255,255,0.06)"
          />
          <PolarAngleAxis
            dataKey="shortName"
            tick={{ fontSize: 11, fill: "#6B7280" }}
          />
          <Radar
            dataKey="score"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.2}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: "#3B82F6",
              stroke: "#0A0D14",
              strokeWidth: 2,
            }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
