import {
  BarChart3,
  Clock,
  FileCheck,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const governancePillars = [
  {
    icon: FileCheck,
    label: "Transparent DAK",
    detail: "End-to-end traceability",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 ring-emerald-500/20",
    delay: "0.05s",
  },
  {
    icon: Scale,
    label: "Accountability",
    detail: "Officer-wise audit trail",
    color: "text-sky-600",
    bg: "bg-sky-500/10 ring-sky-500/20",
    delay: "0.1s",
  },
  {
    icon: ShieldCheck,
    label: "Secure Access",
    detail: "Role-based control",
    color: "text-violet-600",
    bg: "bg-violet-500/10 ring-violet-500/20",
    delay: "0.15s",
  },
  {
    icon: Users,
    label: "Citizen Service",
    detail: "Timely disposal",
    color: "text-amber-700",
    bg: "bg-amber-500/10 ring-amber-500/20",
    delay: "0.2s",
  },
  {
    icon: Clock,
    label: "SLA Monitoring",
    detail: "Due date & escalation alerts",
    color: "text-orange-700",
    bg: "bg-orange-500/10 ring-orange-500/20",
    delay: "0.25s",
  },
  {
    icon: BarChart3,
    label: "District Reports",
    detail: "Analytics & performance insights",
    color: "text-indigo-600",
    bg: "bg-indigo-500/10 ring-indigo-500/20",
    delay: "0.3s",
  },
] as const;

/** Six core platform capability cards above District Administration at a Glance. */
export function AuthGovernancePillars() {
  return (
    <div className="auth-step-rise space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        <span className="h-4 w-1 rounded-full bg-primary" aria-hidden />
        <p className="text-xs font-bold tracking-wide text-foreground uppercase">
          Core Platform Features
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {governancePillars.map(
          ({ icon: Icon, label, detail, color, bg, delay }) => (
            <div
              key={label}
              className={cn(
                "group rounded-xl border border-border/50 bg-card/85 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                bg
              )}
              style={{ animationDelay: delay }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1",
                    bg,
                    color
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                    {detail}
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
