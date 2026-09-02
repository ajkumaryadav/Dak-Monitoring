import { CheckCircle2, Clock, Users } from "lucide-react";

import type { TaskProgressSummary } from "@/features/tasks/lib/task-types";
import { cn } from "@/lib/utils";

interface TaskProgressPanelProps {
  progress: TaskProgressSummary;
  className?: string;
}

export function TaskProgressPanel({ progress, className }: TaskProgressPanelProps) {
  return (
    <div className={cn("rounded-xl border bg-muted/20 p-5", className)}>
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <h2 className="font-semibold">Task Progress</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Assignees" value={progress.total} />
        <Stat
          label="Completed"
          value={progress.completed}
          icon={CheckCircle2}
          tone="success"
        />
        <Stat
          label="In Progress"
          value={progress.inProgress}
          icon={Clock}
          tone="info"
        />
        <Stat label="Pending" value={progress.pending} tone="muted" />
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-semibold">{progress.completionPct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress.completionPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "info" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "info"
        ? "text-sky-700 dark:text-sky-400"
        : tone === "muted"
          ? "text-muted-foreground"
          : "";

  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 flex items-center gap-1.5 text-2xl font-semibold", toneClass)}>
        {Icon && <Icon className="size-5" />}
        {value}
      </p>
    </div>
  );
}
