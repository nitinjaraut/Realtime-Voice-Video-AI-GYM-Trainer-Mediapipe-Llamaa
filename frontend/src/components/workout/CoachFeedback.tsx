"use client";

import GlassCard from "@/components/ui/GlassCard";

interface CoachFeedbackProps {
  feedbackText: string | null;
  audioUrl: string | null;
}

export default function CoachFeedback({ feedbackText }: CoachFeedbackProps) {
  if (!feedbackText) {
    return (
      <GlassCard className="h-full flex items-center justify-center p-6 text-center">
        <p className="text-[var(--color-text-dimmed)] text-sm">
          Start your workout. AI coach feedback will appear here.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard glow="blue" className="h-full flex flex-col p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          AI Coach
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed border-l-2 border-[var(--color-accent-blue)] pl-3 italic bg-[var(--color-accent-blue)]/5 p-3 rounded-r-lg">
          &ldquo;{feedbackText}&rdquo;
        </p>
      </div>
    </GlassCard>
  );
}
