"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailySummary } from "@/lib/api";

interface ProgressChartProps {
  data: DailySummary[];
  metric: "volume" | "form" | "fatigue";
}

const metricConfig = {
  volume: {
    key: "total_reps",
    label: "Volume (Reps)",
    color: "#3B82F6",
    gradientId: "volumeGradient",
  },
  form: {
    key: "avg_form_score",
    label: "Form Score (%)",
    color: "#10B981",
    gradientId: "formGradient",
  },
  fatigue: {
    key: "avg_fatigue_score",
    label: "Fatigue Score",
    color: "#F59E0B",
    gradientId: "fatigueGradient",
  },
};

export default function ProgressChart({ data, metric }: ProgressChartProps) {
  const config = metricConfig[metric];

  const chartData = data
    .filter((d) => d[config.key as keyof DailySummary] != null)
    .map((d) => ({
      date: d.date,
      value: d[config.key as keyof DailySummary] as number,
    }));

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64">
        <p className="text-[var(--color-text-dimmed)] text-sm">
          No {config.label.toLowerCase()} data yet. Complete some workouts to see trends!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
        {config.label} Trend
      </h3>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={config.color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickFormatter={(v: string) => {
              const d = new Date(v);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis hide />

          <Tooltip
            contentStyle={{
              background: "#111520",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#fff",
            }}
            labelFormatter={(v: any) => `Date: ${v}`}
            formatter={(value: any) => [Math.round(Number(value)), config.label]}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={config.color}
            strokeWidth={2}
            fill={`url(#${config.gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: config.color, stroke: "#0A0D14", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
