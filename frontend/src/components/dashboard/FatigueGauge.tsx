"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface FatigueGaugeProps {
  score: number; // 0–100
}

function getColor(score: number): string {
  if (score <= 40) return "#10B981"; // green
  if (score <= 75) return "#F59E0B"; // amber
  return "#EF4444"; // red
}

function getLabel(score: number): string {
  if (score <= 40) return "Fresh & Recovered";
  if (score <= 75) return "Optimal Strain";
  return "High Fatigue";
}

function getGlowClass(score: number): string {
  if (score <= 40) return "glow-green";
  if (score <= 75) return "glow-amber";
  return "glow-red";
}

export default function FatigueGauge({ score }: FatigueGaugeProps) {
  const color = getColor(score);
  const label = getLabel(score);

  // Data for a semi-circle gauge
  const data = [
    { value: score },
    { value: 100 - score },
  ];

  return (
    <div className={`glass-card p-6 flex flex-col items-center ${getGlowClass(score)}`}>
      <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
        Training Fatigue
      </h3>

      <div className="relative w-48 h-28">
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={85}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-4xl font-bold tabular-nums" style={{ color }}>
            {score}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">/100</span>
        </div>
      </div>

      <span className="text-sm font-medium mt-2" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
