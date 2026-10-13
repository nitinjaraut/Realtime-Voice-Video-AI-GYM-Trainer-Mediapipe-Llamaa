import clsx from "clsx";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: string;
  accent?: "green" | "blue" | "amber" | "red" | "default";
  size?: "sm" | "md" | "lg";
}

const accentColors = {
  green: "text-[var(--color-accent-green)]",
  blue: "text-[var(--color-accent-blue)]",
  amber: "text-[var(--color-accent-amber)]",
  red: "text-[var(--color-accent-red)]",
  default: "text-[var(--color-text-primary)]",
};

const sizeMap = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-4xl",
};

export default function MetricCard({
  label,
  value,
  icon,
  accent = "default",
  size = "md",
}: MetricCardProps) {
  return (
    <div className="glass-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <span className={clsx("font-bold tabular-nums", sizeMap[size], accentColors[accent])}>
        {value}
      </span>
    </div>
  );
}
