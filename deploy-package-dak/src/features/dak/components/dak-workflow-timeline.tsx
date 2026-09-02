"use client";

import { useMemo, useState } from "react";

import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import {
  buildDakJourneyEvents,
  matchesJourneyFilter,
  type JourneyFilter,
} from "@/features/dak/lib/dak-journey";
import type {
  DakAtrRecord,
  DakRemarkRecord,
} from "@/features/remarks/services/get-remarks";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ id: JourneyFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "assignments", label: "Assignments" },
  { id: "notes", label: "Notes" },
  { id: "atr", label: "ATR" },
  { id: "compliance", label: "Compliance" },
  { id: "attachments", label: "Attachments" },
  { id: "rework", label: "Rework" },
  { id: "closure", label: "Closure" },
];

interface DakWorkflowTimelineProps {
  timeline: DakTimelineEvent[];
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
  description?: string;
  className?: string;
}

/**
 * Unified workflow timeline with journey-style connector graphics —
 * icons, vertical lines, and event cards (registration → closure).
 * Collector / ADM / ACP review remarks live in Available Actions, not here.
 */
export function DakWorkflowTimeline({
  timeline,
  remarks,
  atrRecords,
  description = "Complete workflow history — registration through closure",
  className,
}: DakWorkflowTimelineProps) {
  const [filter, setFilter] = useState<JourneyFilter>("all");
  const events = useMemo(
    () => buildDakJourneyEvents({ timeline, remarks, atrRecords }),
    [timeline, remarks, atrRecords]
  );
  const visible = events.filter((event) => matchesJourneyFilter(event, filter));

  return (
    <section
      className={cn(
        "flex max-h-72 flex-col overflow-hidden rounded-xl border bg-card p-3 shadow-sm sm:max-h-80 sm:p-4",
        className
      )}
    >
      <div className="shrink-0">
        <h2 className="text-sm font-bold">Workflow Timeline</h2>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>

      <div className="mt-3 flex shrink-0 flex-wrap gap-1.5">
        {FILTERS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              filter === chip.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {visible.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            No data available.
          </p>
        ) : (
          <ol className="relative space-y-0">
            {visible.map((event, index) => (
              <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                {index < visible.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-9 left-[17px] h-[calc(100%-1.25rem)] w-px bg-border"
                  />
                ) : null}
                <div className="relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-sm shadow-sm ring-2 ring-primary/10">
                  <span aria-hidden>{event.icon}</span>
                </div>
                <div className="min-w-0 flex-1 rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5 transition-colors hover:bg-muted/20">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {event.actorName ?? "System"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {[event.actorRole, event.departmentLabel]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                    <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {formatDakDateTime(event.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1.5 text-sm font-medium">{event.title}</p>
                  {event.description ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  ) : null}
                  {event.attachmentName ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md border bg-background px-2 py-1 font-medium">
                        📎 {event.attachmentName}
                      </span>
                      {event.attachmentUrl ? (
                        <>
                          <a
                            href={event.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            Preview
                          </a>
                          <a
                            href={event.attachmentUrl}
                            download={event.attachmentName}
                            className="font-medium text-primary hover:underline"
                          >
                            Download
                          </a>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
