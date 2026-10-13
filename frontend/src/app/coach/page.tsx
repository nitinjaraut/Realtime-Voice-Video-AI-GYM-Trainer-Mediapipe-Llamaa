"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ChatWindow from "@/components/coach/ChatWindow";
import GlassCard from "@/components/ui/GlassCard";

export default function CoachPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-[var(--color-accent-blue)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in h-[calc(100vh-100px)] flex flex-col">
      <header className="mb-2 shrink-0">
        <h1 className="text-3xl font-bold">AI Coach</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Ask questions about form, nutrition, injury prevention, and recovery.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <ChatWindow />
        </div>
        
        <div className="hidden lg:block space-y-4">
          <GlassCard padding="sm" className="bg-[var(--color-accent-blue)]/5 border-[var(--color-accent-blue)]/20">
            <h3 className="font-bold text-sm mb-2 text-[var(--color-accent-blue)]">Try asking:</h3>
            <ul className="text-xs space-y-2 text-[var(--color-text-muted)]">
              <li>"How do I fix my squat depth?"</li>
              <li>"What should I eat before a workout?"</li>
              <li>"My lower back hurts during lunges, why?"</li>
              <li>"How many rest days do I need?"</li>
            </ul>
          </GlassCard>
          
          <GlassCard padding="sm">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <span className="text-[var(--color-accent-green)]">●</span> Guardrails Active
            </h3>
            <p className="text-xs text-[var(--color-text-dimmed)]">
              This AI is restricted to fitness topics and will automatically provide disclaimers for medical queries. Powered by ChromaDB.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
