import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { StatCardVariant } from "@/features/dashboard/components/stat-card";
import { cn } from "@/lib/utils";

const variantStyles: Record<
  StatCardVariant,
  { card: string; icon: string; title: string; badge: string }
> = {
  primary: {
    card: "border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background",
    icon: "bg-primary text-primary-foreground shadow-primary/25",
    title: "text-primary",
    badge: "bg-primary/10 text-primary",
  },
  info: {
    card: "border-sky-500/25 hover:border-sky-500/45 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-background",
    icon: "bg-sky-600 text-white shadow-sky-600/30",
    title: "text-sky-700 dark:text-sky-400",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  warning: {
    card: "border-amber-500/25 hover:border-amber-500/45 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background",
    icon: "bg-amber-600 text-white shadow-amber-600/30",
    title: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  success: {
    card: "border-emerald-500/25 hover:border-emerald-500/45 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background",
    icon: "bg-emerald-600 text-white shadow-emerald-600/30",
    title: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  danger: {
    card: "border-destructive/25 hover:border-destructive/45 bg-gradient-to-br from-destructive/10 via-destructive/5 to-background",
    icon: "bg-destructive text-white shadow-destructive/30",
    title: "text-destructive",
    badge: "bg-destructive/10 text-destructive",
  },
  purple: {
    card: "border-violet-500/25 hover:border-violet-500/45 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-background",
    icon: "bg-violet-600 text-white shadow-violet-600/30",
    title: "text-violet-700 dark:text-violet-300",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  teal: {
    card: "border-teal-500/25 hover:border-teal-500/45 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-background",
    icon: "bg-teal-600 text-white shadow-teal-600/30",
    title: "text-teal-700 dark:text-teal-300",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  },
  indigo: {
    card: "border-indigo-500/25 hover:border-indigo-500/45 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-background",
    icon: "bg-indigo-600 text-white shadow-indigo-600/30",
    title: "text-indigo-700 dark:text-indigo-300",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
  orange: {
    card: "border-orange-500/25 hover:border-orange-500/45 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-background",
    icon: "bg-orange-600 text-white shadow-orange-600/30",
    title: "text-orange-700 dark:text-orange-300",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
};

interface ReportLinkCardProps {
  title: string;
  description: string;
  footnote: string;
  href: string;
  icon: LucideIcon;
  variant: StatCardVariant;
  tag: string;
}

export function ReportLinkCard({
  title,
  description,
  footnote,
  href,
  icon: Icon,
  variant,
  tag,
}: ReportLinkCardProps) {
  const styles = variantStyles[variant];

  return (
    <Link href={href} className="group block h-full">
      <article
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          styles.card
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl shadow-md",
              styles.icon
            )}
          >
            <Icon className="size-6" />
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
        </div>

        <div className="mt-4 min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn("text-lg font-bold tracking-tight", styles.title)}>
              {title}
            </h2>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                styles.badge
              )}
            >
              {tag}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <p className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          {footnote}
        </p>
      </article>
    </Link>
  );
}
