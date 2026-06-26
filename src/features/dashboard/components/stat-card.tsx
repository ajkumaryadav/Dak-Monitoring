import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatCardVariant =
  | "primary"
  | "info"
  | "warning"
  | "success"
  | "danger";

const variantStyles: Record<
  StatCardVariant,
  { card: string; icon: string; value: string }
> = {
  primary: {
    card: "border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background",
    icon: "bg-primary text-primary-foreground shadow-primary/25",
    value: "text-primary",
  },
  info: {
    card: "border-[oklch(0.55_0.12_240)]/25 bg-gradient-to-br from-[oklch(0.55_0.12_240)]/10 via-[oklch(0.55_0.12_240)]/5 to-background",
    icon: "bg-[oklch(0.45_0.11_240)] text-white shadow-[oklch(0.45_0.11_240)]/30",
    value: "text-[oklch(0.38_0.11_240)]",
  },
  warning: {
    card: "border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background",
    icon: "bg-amber-600 text-white shadow-amber-600/30",
    value: "text-amber-700 dark:text-amber-400",
  },
  success: {
    card: "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background",
    icon: "bg-emerald-600 text-white shadow-emerald-600/30",
    value: "text-emerald-700 dark:text-emerald-400",
  },
  danger: {
    card: "border-destructive/25 bg-gradient-to-br from-destructive/10 via-destructive/5 to-background",
    icon: "bg-destructive text-white shadow-destructive/30",
    value: "text-destructive",
  },
};

export interface StatCardTrend {
  label: string;
  direction: "up" | "down" | "neutral";
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: StatCardVariant;
  trend?: StatCardTrend;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "primary",
  trend,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        styles.card,
        className
      )}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {title}
          </p>
          <p className={cn("text-3xl font-bold tracking-tight", styles.value)}>
            {value}
          </p>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.direction === "up" && "text-emerald-600 dark:text-emerald-400",
                trend.direction === "down" && "text-destructive",
                trend.direction === "neutral" && "text-muted-foreground"
              )}
            >
              {trend.direction === "up" && <TrendingUp className="size-3.5" />}
              {trend.direction === "down" && (
                <TrendingDown className="size-3.5" />
              )}
              {trend.label}
            </div>
          )}
          {description && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-md",
            styles.icon
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
