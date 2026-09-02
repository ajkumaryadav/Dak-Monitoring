import { Check, Circle, Clock } from "lucide-react";

import type { ComplianceProgressStep } from "@/features/dak/lib/compliance-workflow";
import { cn } from "@/lib/utils";

interface DakComplianceProgressProps {
  steps: ComplianceProgressStep[];
  currentStatusLabel: string;
}

export function DakComplianceProgress({
  steps,
  currentStatusLabel,
}: DakComplianceProgressProps) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            DAK Progress
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            Current status:{" "}
            <span className="text-primary">{currentStatusLabel}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Status updates automatically — no manual selection required
        </p>
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-5">
        {steps.map((step, index) => {
          const Icon =
            step.state === "complete"
              ? Check
              : step.state === "current"
                ? Clock
                : Circle;

          return (
            <li
              key={step.id}
              className={cn(
                "relative rounded-xl border px-3 py-3 text-center",
                step.state === "complete" &&
                  "border-emerald-500/25 bg-emerald-500/[0.06]",
                step.state === "current" &&
                  "border-primary/30 bg-primary/[0.06] ring-1 ring-primary/15",
                step.state === "pending" &&
                  "border-border/60 bg-muted/20 text-muted-foreground"
              )}
            >
              {index < steps.length - 1 && (
                <span
                  className="absolute top-1/2 -right-2 hidden h-px w-4 -translate-y-1/2 bg-border sm:block"
                  aria-hidden
                />
              )}
              <div className="mx-auto flex size-7 items-center justify-center rounded-full bg-background shadow-sm">
                <Icon
                  className={cn(
                    "size-3.5",
                    step.state === "complete" && "text-emerald-600",
                    step.state === "current" && "text-primary",
                    step.state === "pending" && "text-muted-foreground/60"
                  )}
                />
              </div>
              <p className="mt-2 text-[11px] font-semibold leading-tight">
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
