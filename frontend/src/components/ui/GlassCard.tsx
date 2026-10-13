import { type ReactNode } from "react";
import clsx from "clsx";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "sm" | "md" | "lg";
  glow?: "green" | "blue" | "amber" | "red" | "none";
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const glowMap = {
  green: "glow-green",
  blue: "glow-blue",
  amber: "glow-amber",
  red: "glow-red",
  none: "",
};

export default function GlassCard({
  children,
  className,
  hoverable = false,
  padding = "md",
  glow = "none",
}: GlassCardProps) {
  return (
    <div
      className={clsx(
        "glass-card",
        hoverable && "glass-card-hover cursor-pointer",
        paddingMap[padding],
        glowMap[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
