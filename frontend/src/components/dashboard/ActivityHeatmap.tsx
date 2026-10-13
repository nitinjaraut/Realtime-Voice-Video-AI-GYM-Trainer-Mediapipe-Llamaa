"use client";

import { useMemo } from "react";
import type { DailySummary } from "@/lib/api";

interface ActivityHeatmapProps {
  data: DailySummary[];
  days?: number;
}

function getIntensityColor(count: number): string {
  if (count === 0) return "rgba(255,255,255,0.03)";
  if (count === 1) return "rgba(0,255,136,0.2)";
  if (count <= 3) return "rgba(0,255,136,0.4)";
  if (count <= 5) return "rgba(0,255,136,0.6)";
  return "rgba(0,255,136,0.85)";
}

export default function ActivityHeatmap({ data, days = 90 }: ActivityHeatmapProps) {
  const grid = useMemo(() => {
    // Build a map from date string to workout count
    const dateMap = new Map<string, DailySummary>();
    data.forEach((d) => dateMap.set(d.date, d));

    // Generate grid of last N days
    const cells: Array<{
      date: string;
      count: number;
      summary: DailySummary | null;
    }> = [];

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const summary = dateMap.get(key) || null;

      cells.push({
        date: key,
        count: summary?.workout_count || 0,
        summary,
      });
    }

    return cells;
  }, [data, days]);

  // Split into weeks (columns of 7)
  const weeks: typeof grid[] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
        Workout Activity
      </h3>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                className="w-3 h-3 rounded-sm transition-all duration-200 hover:scale-150 cursor-pointer relative group"
                style={{ backgroundColor: getIntensityColor(cell.count) }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="glass-card p-2 text-xs whitespace-nowrap text-center min-w-[120px]">
                    <div className="font-medium">{cell.date}</div>
                    {cell.summary ? (
                      <>
                        <div className="text-[var(--color-accent-green)]">
                          {cell.summary.exercises}
                        </div>
                        <div className="text-[var(--color-text-muted)]">
                          {cell.summary.total_reps} reps · {cell.summary.total_sets} sets
                        </div>
                        {cell.summary.avg_form_score && (
                          <div className="text-[var(--color-accent-blue)]">
                            Form: {Math.round(cell.summary.avg_form_score)}%
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-[var(--color-text-dimmed)]">Rest day</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-[var(--color-text-dimmed)]">
        <span>Less</span>
        {[0, 1, 3, 5, 6].map((v) => (
          <div
            key={v}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getIntensityColor(v) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
