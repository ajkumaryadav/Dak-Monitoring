import { Building2, Timer } from "lucide-react";

import type { PortalDistrictGlanceData } from "@/features/auth/services/portal-workflow-stats";
import { appConfig } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

interface AuthDistrictGlancePanelProps {
  data: PortalDistrictGlanceData;
}

/** Compact live district stats — Total / Pending / Closed + governance pulse. */
export function AuthDistrictGlancePanel({ data }: AuthDistrictGlancePanelProps) {
  const circumference = 2 * Math.PI * 28;
  const progress = Math.max(0, Math.min(100, data.completionRate));
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className="auth-step-rise auth-district-glance w-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.06] via-card to-amber-500/[0.05] shadow-md">
      <div className="auth-tricolor-bar h-1 w-full" aria-hidden />

      <div className="relative space-y-3 p-3.5 sm:p-4">
        <div className="auth-visual-orb auth-glance-glow pointer-events-none absolute -right-6 -top-4 size-20 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="auth-step-pulse flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20">
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-foreground">
                District Administration at a Glance
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {appConfig.district} · Live DAK counts
              </p>
            </div>
          </div>
          {data.unavailable ? (
            <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
              Unavailable
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="auth-dot-pulse size-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          )}
        </div>

        {data.unavailable ? (
          <p className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/[0.07] px-3 py-4 text-center text-xs text-amber-800 dark:text-amber-200">
            Live figures temporarily unavailable.
          </p>
        ) : (
          <>
            <div className="relative grid grid-cols-3 gap-2 text-center">
              {data.stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn(
                    "auth-stat-pop rounded-lg border border-border/40 bg-background/90 px-1.5 py-2 shadow-sm ring-1",
                    stat.ring
                  )}
                  style={{ animationDelay: `${0.2 + i * 0.08}s` }}
                >
                  <p className={cn("text-base font-bold tabular-nums", stat.accent)}>
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative flex items-center gap-3 border-t border-border/40 pt-3">
              <div className="auth-step-pulse relative shrink-0">
                <svg viewBox="0 0 72 72" className="size-14" aria-hidden>
                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-muted/30"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke="url(#glanceRingGradient)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="origin-center -rotate-90"
                    style={{ transformOrigin: "36px 36px" }}
                  />
                  <defs>
                    <linearGradient
                      id="glanceRingGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Timer className="size-3 text-primary" />
                  <span className="text-[11px] font-bold tabular-nums text-foreground">
                    {data.completionRate}%
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Governance Pulse
                  </p>
                  <p className="text-[10px] tabular-nums text-muted-foreground">
                    {data.overdue} overdue
                  </p>
                </div>
                {data.metrics.slice(0, 3).map((metric, i) => (
                  <div key={metric.label}>
                    <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                      <span className="truncate text-muted-foreground">
                        {metric.label}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-foreground">
                        {metric.value}%
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn(
                          "auth-glance-progress h-full rounded-full bg-gradient-to-r",
                          metric.color
                        )}
                        style={{
                          width: `${metric.value}%`,
                          animationDelay: `${0.4 + i * 0.1}s`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
