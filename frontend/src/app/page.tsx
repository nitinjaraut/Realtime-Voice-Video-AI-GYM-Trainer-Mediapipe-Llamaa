"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const { login, user, error: authError } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      await login(username);
      router.push("/dashboard");
    } catch (err) {
      // Error is handled by useAuth
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">FormFit</span> AI
        </h1>
        <p className="text-[var(--color-text-muted)] text-lg">
          Your personal AI fitness coach and form analyzer
        </p>
      </div>

      <GlassCard className="w-full max-w-md p-8" glow="blue">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[var(--color-text-dimmed)] mb-2">
              Enter your username to start
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. gymbro99"
              className="w-full bg-white/5 border border-[var(--color-border-glass)] rounded-xl px-4 py-3 text-white placeholder-[var(--color-text-dimmed)] focus:outline-none focus:border-[var(--color-accent-blue)] transition-colors"
              disabled={isLoading}
              required
            />
          </div>

          {authError && (
            <p className="text-[var(--color-accent-red)] text-sm">{authError}</p>
          )}

          <button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="w-full bg-gradient-to-r from-[var(--color-accent-blue)] to-[#2563EB] text-white py-3 rounded-xl font-bold shadow-lg shadow-[var(--color-accent-blue)]/20 hover:shadow-[var(--color-accent-blue)]/40 transition-all disabled:opacity-50"
          >
            {isLoading ? "Connecting..." : "Enter Gym"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
