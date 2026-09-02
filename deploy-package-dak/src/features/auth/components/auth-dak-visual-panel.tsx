"use client";

import { Fragment } from "react";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const workflowSteps = [
  {
    icon: FileText,
    label: "DAK Received",
    detail: "Diary entry & registration",
    color: "text-emerald-600",
    ring: "ring-emerald-500/30",
    bg: "bg-emerald-500/10",
    delay: "0s",
  },
  {
    icon: ClipboardList,
    label: "Collector Assignment",
    detail: "Priority, due date & routing",
    color: "text-sky-600",
    ring: "ring-sky-500/30",
    bg: "bg-sky-500/10",
    delay: "0.15s",
  },
  {
    icon: Building2,
    label: "Department Action",
    detail: "Processing & compliance",
    color: "text-violet-600",
    ring: "ring-violet-500/30",
    bg: "bg-violet-500/10",
    delay: "0.3s",
  },
  {
    icon: ShieldCheck,
    label: "ATR & Approval",
    detail: "Review before closure",
    color: "text-amber-600",
    ring: "ring-amber-500/30",
    bg: "bg-amber-500/10",
    delay: "0.45s",
  },
  {
    icon: CheckCircle2,
    label: "Closed",
    detail: "Audit-ready disposal",
    color: "text-primary",
    ring: "ring-primary/30",
    bg: "bg-primary/10",
    delay: "0.6s",
  },
] as const;

const governancePoints = [
  "End-to-end correspondence tracking",
  "Role-based department workflows",
  "SLA monitoring & escalation control",
  "Secure audit trail & notifications",
] as const;

/** Full-width animated DAK workflow banner spanning the login page. */
export function AuthDakVisualPanel() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-3.5 shadow-md backdrop-blur-sm sm:p-4 lg:p-5">
      <div className="auth-visual-orb auth-visual-orb-a pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="auth-visual-orb auth-visual-orb-b pointer-events-none absolute -bottom-8 -left-6 size-24 rounded-full bg-emerald-500/10 blur-2xl" />

      <div className="relative flex flex-col gap-3">
        <div className="text-center lg:text-left">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Digital DAK Lifecycle
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            From receipt at Collectorate to verified closure — fully traceable.
          </p>
        </div>

        {/* Horizontal workflow — icons centered in equal columns; connectors between */}
        <ol className="hidden w-full list-none flex-row items-start p-0 md:flex">
          {workflowSteps.map(
            ({ icon: Icon, label, detail, color, ring, bg, delay }, index) => (
              <Fragment key={label}>
                {index > 0 && (
                  <li
                    aria-hidden
                    className="flex min-w-[0.75rem] flex-1 list-none items-center self-stretch pt-6"
                  >
                    <span className="auth-flow-line-horizontal h-0.5 w-full" />
                  </li>
                )}
                <li
                  className="auth-step-rise flex min-w-0 flex-1 flex-col items-center text-center"
                  style={{ animationDelay: delay }}
                >
                  <div
                    className={cn(
                      "auth-step-pulse relative z-10 flex size-12 shrink-0 items-center justify-center rounded-xl ring-2",
                      bg,
                      ring,
                      color
                    )}
                    style={{ animationDelay: delay }}
                  >
                    <Icon className="size-5" />
                    <span
                      className="auth-step-ring absolute inset-0 rounded-xl"
                      style={{ animationDelay: delay }}
                    />
                  </div>
                  <div className="mt-3 min-w-0 px-1">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                </li>
              </Fragment>
            )
          )}
        </ol>

        {/* Vertical workflow — mobile & tablet narrow */}
        <ol className="relative space-y-0 md:hidden">
          {workflowSteps.map(
            ({ icon: Icon, label, detail, color, ring, bg, delay }, index) => (
              <li
                key={`mobile-${label}`}
                className="auth-step-rise relative flex gap-3 pb-5 last:pb-0"
                style={{ animationDelay: delay }}
              >
                {index < workflowSteps.length - 1 && (
                  <span
                    className="auth-flow-line-vertical absolute top-12 left-[1.35rem] h-[calc(100%-2.25rem)] w-0.5 -translate-x-1/2"
                    aria-hidden
                  />
                )}
                <div
                  className={cn(
                    "auth-step-pulse relative z-10 flex size-11 shrink-0 items-center justify-center rounded-xl ring-2",
                    bg,
                    ring,
                    color
                  )}
                  style={{ animationDelay: delay }}
                >
                  <Icon className="size-5" />
                  <span
                    className="auth-step-ring absolute inset-0 rounded-xl"
                    style={{ animationDelay: delay }}
                  />
                </div>
                <div className="min-w-0 flex-1 pt-1.5">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {detail}
                  </p>
                </div>
              </li>
            )
          )}
        </ol>

        <div className="grid gap-3 border-t border-border/50 pt-3 lg:grid-cols-[minmax(0,1fr)_6rem] lg:items-center lg:gap-4">
          <ul className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
            {governancePoints.map((point, index) => (
              <li
                key={point}
                className="auth-point-fade flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-2.5 py-2 text-[11px] text-muted-foreground"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <span
                  className="auth-dot-pulse size-1.5 shrink-0 rounded-full bg-primary"
                  style={{ animationDelay: `${index * 0.25}s` }}
                />
                {point}
              </li>
            ))}
          </ul>

          <div className="auth-doc-float relative mx-auto h-20 w-24 shrink-0 lg:mx-0 lg:ml-auto">
            <div className="auth-doc-layer auth-doc-layer-back absolute top-4 left-1 size-12 rotate-[-8deg] rounded-lg border border-border/60 bg-muted/40 shadow-sm" />
            <div className="auth-doc-layer auth-doc-layer-mid absolute top-2 left-3 size-14 rotate-[4deg] rounded-lg border border-primary/20 bg-primary/5 shadow-md" />
            <div className="auth-doc-layer auth-doc-layer-front absolute top-2 left-6 flex size-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-primary/25 bg-gradient-to-br from-primary/15 to-background shadow-lg">
              <FileText className="size-5 text-primary" />
              <span className="text-[8px] font-semibold tracking-wider text-primary uppercase">
                DAK File
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
