import { Clock } from "lucide-react";

import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import type { TaskTimelineEntry } from "@/features/tasks/services/tasks";

interface TaskTimelinePanelProps {
  entries: TaskTimelineEntry[];
}

const STATUS_STEPS = [
  "Task Assigned",
  "Status: accepted",
  "Status: in_progress",
  "ATR / Compliance Submitted",
  "Status: approved",
  "Status: closed",
] as const;

export function TaskTimelinePanel({ entries }: TaskTimelinePanelProps) {
  if (!entries.length) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No timeline events recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_STEPS.map((step) => {
          const done = entries.some((e) => e.action === step);
          return (
            <span
              key={step}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
                done
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.replace("Status: ", "").replace("Task ", "")}
            </span>
          );
        })}
      </div>

      <ol className="relative space-y-0 border-l border-primary/20 pl-6">
        {entries.map((entry, index) => {
          const isLatest = index === 0;
          return (
            <li
              key={entry.id}
              className={`relative pb-5 ${index === entries.length - 1 ? "pb-0" : ""}`}
            >
              <span
                className={`absolute top-1 -left-[calc(0.75rem+1px)] size-3 rounded-full ring-4 ring-background ${
                  isLatest ? "bg-primary" : "bg-primary/40"
                }`}
              />
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">{entry.action}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDakDateTime(entry.createdAt)}
                {entry.performerName ? ` · ${entry.performerName}` : ""}
              </p>
              {entry.remarks?.trim() && (
                <p className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {entry.remarks}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
