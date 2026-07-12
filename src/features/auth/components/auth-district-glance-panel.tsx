import {
  Building2,
  FileText,
  Landmark,
  ShieldCheck,
  Timer,
} from "lucide-react";

import { appConfig } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const stats = [
  { value: "24×7", label: "Portal Access", accent: "text-sky-600", ring: "ring-sky-500/25" },
  { value: "100%", label: "Audit Trail", accent: "text-emerald-600", ring: "ring-emerald-500/25" },
  { value: "RBAC", label: "Secure Roles", accent: "text-violet-600", ring: "ring-violet-500/25" },
] as const;

const governanceMetrics = [
  { label: "Digital File Movement", value: 95, color: "from-sky-500 to-blue-600" },
  { label: "Compliance & ATR Review", value: 88, color: "from-violet-500 to-purple-600" },
  { label: "SLA & Timely Disposal", value: 90, color: "from-amber-500 to-orange-600" },
  { label: "Secure Officer Access", value: 100, color: "from-emerald-500 to-teal-600" },
] as const;

const pulseNodes = [
  { icon: Landmark, label: "Collectorate", delay: "0s" },
  { icon: Building2, label: "Departments", delay: "0.4s" },
  { icon: FileText, label: "DAK Files", delay: "0.8s" },
  { icon: ShieldCheck, label: "Audit", delay: "1.2s" },
] as const;

/** Expanded district stats panel — fills bottom-right column with animated governance graphics. */
export function AuthDistrictGlancePanel() {
  return (
    <div className="auth-step-rise auth-district-glance flex overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.06] via-card to-amber-500/[0.05] shadow-lg lg:min-h-[13rem] lg:flex-1 lg:flex-col">
      <div className="auth-tricolor-bar h-1 w-full shrink-0" aria-hidden />

      <div className="relative flex flex-1 flex-col p-4 sm:p-5">
        <div className="auth-visual-orb auth-glance-glow pointer-events-none absolute -right-6 -top-4 size-28 rounded-full bg-primary/10 blur-2xl" />
        <div className="auth-visual-orb auth-visual-orb-b pointer-events-none absolute -bottom-6 -left-4 size-24 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="auth-step-pulse flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <Building2 className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">
              District Administration at a Glance
            </p>
            <p className="text-[11px] text-muted-foreground">
              {appConfig.district} · e-Governance readiness
            </p>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-3 gap-2 text-center">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "auth-stat-pop rounded-xl border border-border/40 bg-background/90 px-2 py-3 shadow-sm ring-1",
                stat.ring
              )}
              style={{ animationDelay: `${0.35 + i * 0.1}s` }}
            >
              <p className={cn("text-lg font-bold", stat.accent)}>{stat.value}</p>
              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-4 flex flex-1 flex-col justify-center gap-4 border-t border-border/40 pt-4">
          <div className="flex items-center gap-4">
            <div className="auth-step-pulse relative mx-auto shrink-0 sm:mx-0">
              <svg
                viewBox="0 0 88 88"
                className="size-[5.5rem]"
                aria-hidden
              >
                <circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted/30"
                />
                <circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke="url(#glanceRingGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="226"
                  strokeDashoffset="34"
                  className="origin-center -rotate-90"
                  style={{ transformOrigin: "44px 44px" }}
                />
                <defs>
                  <linearGradient id="glanceRingGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Timer className="size-4 text-primary" />
                <span className="mt-0.5 text-xs font-bold text-foreground">Live</span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Governance Pulse
              </p>
              {governanceMetrics.map((metric, i) => (
                <div key={metric.label}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
                    <span className="truncate text-muted-foreground">{metric.label}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">
                      {metric.value}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={cn(
                        "auth-glance-progress h-full rounded-full bg-gradient-to-r",
                        metric.color
                      )}
                      style={{
                        width: `${metric.value}%`,
                        animationDelay: `${0.5 + i * 0.12}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {pulseNodes.map(({ icon: Icon, label, delay }) => (
              <div
                key={label}
                className="auth-point-fade flex flex-col items-center gap-1.5 rounded-lg border border-border/40 bg-background/70 px-1.5 py-2.5 text-center"
                style={{ animationDelay: delay }}
              >
                <div className="relative flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/15">
                  <Icon className="size-3.5" />
                  <span
                    className="auth-dot-pulse absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-emerald-500"
                    style={{ animationDelay: delay }}
                  />
                </div>
                <span className="text-[8px] font-medium leading-tight text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
