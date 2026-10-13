"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardData, getOverallStats, type DashboardData, type OverallStats } from "@/lib/api";
import MetricCard from "@/components/ui/MetricCard";
import FatigueGauge from "@/components/dashboard/FatigueGauge";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import ProgressChart from "@/components/dashboard/ProgressChart";
import FormRadarChart from "@/components/dashboard/FormRadarChart";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [dashData, overallStats] = await Promise.all([
          getDashboardData(user.user_id),
          getOverallStats(user.user_id),
        ]);
        setData(dashData);
        setStats(overallStats);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-[var(--color-accent-blue)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !data || !stats) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user.username}</h1>
        <p className="text-[var(--color-text-muted)] mt-1">Here's your training overview.</p>
      </header>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Workouts" value={stats.total_workouts} icon="🔥" accent="amber" />
        <MetricCard label="Total Volume (Reps)" value={stats.total_reps} icon="💪" accent="blue" />
        <MetricCard label="Avg Form Score" value={stats.avg_form_score ? `${stats.avg_form_score}%` : "N/A"} icon="🎯" accent="green" />
        <MetricCard label="Training Time (Min)" value={stats.total_duration_minutes} icon="⏱️" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityHeatmap data={data.daily_summary} />
          <ProgressChart data={data.daily_summary} metric="volume" />
          <ProgressChart data={data.daily_summary} metric="form" />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <FatigueGauge score={data.fatigue_score} />
          <FormRadarChart data={data.radar_data} />
        </div>
      </div>
    </div>
  );
}
