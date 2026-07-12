import {
  BellRing,
  BookOpen,
  Clock,
  FileInput,
  Scale,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const governancePillars = [
  {
    icon: FileInput,
    label: "Diary Registration",
    detail: "Official receipt, numbering & reference",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 ring-emerald-500/20",
    delay: "0.05s",
  },
  {
    icon: Users,
    label: "Officer Assignment",
    detail: "Collector to department & section routing",
    color: "text-sky-600",
    bg: "bg-sky-500/10 ring-sky-500/20",
    delay: "0.1s",
  },
  {
    icon: BookOpen,
    label: "Compliance Submission",
    detail: "Action summary, ATR & supporting files",
    color: "text-violet-600",
    bg: "bg-violet-500/10 ring-violet-500/20",
    delay: "0.15s",
  },
  {
    icon: Scale,
    label: "Accountability",
    detail: "Immutable timeline & audit history",
    color: "text-indigo-600",
    bg: "bg-indigo-500/10 ring-indigo-500/20",
    delay: "0.2s",
  },
  {
    icon: Clock,
    label: "SLA & Due Dates",
    detail: "Monitoring, extensions & overdue alerts",
    color: "text-orange-700",
    bg: "bg-orange-500/10 ring-orange-500/20",
    delay: "0.25s",
  },
  {
    icon: BellRing,
    label: "Notifications",
    detail: "Rework, clarification & status updates",
    color: "text-amber-700",
    bg: "bg-amber-500/10 ring-amber-500/20",
    delay: "0.3s",
  },
] as const;

/** Six distinct platform capabilities — fills the left column without repeating brand highlights. */
export function AuthGovernancePillars() {
  return (
    <div className="auth-step-rise space-y-3">
      <div className="flex items-center gap-2 px-0.5">
        <span className="h-4 w-1 rounded-full bg-primary" aria-hidden />
        <p className="text-xs font-bold tracking-wide text-foreground uppercase">
          Platform Capabilities
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {governancePillars.map(
          ({ icon: Icon, label, detail, color, bg, delay }) => (
            <div
              key={label}
              className={cn(
                "group rounded-xl border border-border/50 bg-card/85 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                bg
              )}
              style={{ animationDelay: delay }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
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
