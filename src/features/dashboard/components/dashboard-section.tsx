import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "primary" | "neutral" | "blue" | "red" | "purple" | "teal" | "indigo";
  children: React.ReactNode;
  className?: string;
}

const sectionStyles = {
  primary: {
    wrapper:
      "border-primary/15 bg-gradient-to-br from-primary/[0.07] via-background to-background",
    icon: "bg-primary text-primary-foreground shadow-md shadow-primary/20",
    accent: "bg-primary/60",
  },
  neutral: {
    wrapper:
      "border-border/80 bg-gradient-to-br from-muted/60 via-background to-background",
    icon: "bg-secondary text-secondary-foreground shadow-sm",
    accent: "bg-muted-foreground/30",
  },
  blue: {
    wrapper:
      "border-[oklch(0.55_0.12_240)]/20 bg-gradient-to-br from-[oklch(0.55_0.12_240)]/[0.08] via-background to-background",
    icon: "bg-[oklch(0.45_0.11_240)] text-white shadow-md",
    accent: "bg-[oklch(0.55_0.12_240)]/50",
  },
  red: {
    wrapper:
      "border-destructive/20 bg-gradient-to-br from-destructive/[0.06] via-background to-background",
    icon: "bg-destructive text-white shadow-md shadow-destructive/20",
    accent: "bg-destructive/50",
  },
  purple: {
    wrapper:
      "border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] via-background to-background",
    icon: "bg-violet-600 text-white shadow-md shadow-violet-600/20",
    accent: "bg-violet-500/50",
  },
  teal: {
    wrapper:
      "border-teal-500/20 bg-gradient-to-br from-teal-500/[0.07] via-background to-background",
    icon: "bg-teal-600 text-white shadow-md shadow-teal-600/20",
    accent: "bg-teal-500/50",
  },
  indigo: {
    wrapper:
      "border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.07] via-background to-background",
    icon: "bg-indigo-600 text-white shadow-md shadow-indigo-600/20",
    accent: "bg-indigo-500/50",
  },
};

export function DashboardSection({
  title,
  description,
  icon: Icon,
  variant = "primary",
  children,
  className,
}: DashboardSectionProps) {
  const styles = sectionStyles[variant];

  return (
    <section
      className={cn(
        "rounded-2xl border shadow-sm",
        styles.wrapper,
        className
      )}
    >
      <div className="flex items-start gap-4 border-b border-border/60 px-5 py-4 md:px-6">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            styles.icon
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <span className={cn("h-1 w-1 rounded-full", styles.accent)} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="px-5 py-4 md:px-6 md:py-5">{children}</div>
    </section>
  );
}
