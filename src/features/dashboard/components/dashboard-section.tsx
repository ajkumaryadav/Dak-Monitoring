import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "primary" | "neutral";
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
