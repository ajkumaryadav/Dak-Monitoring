import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { DakHistoryTimeline } from "@/features/audit/components/dak-history-timeline";
import { getRemarkTypeLabel } from "@/features/remarks/lib/remark-types";
import type { DakAtrRecord, DakRemarkRecord } from "@/features/remarks/services/get-remarks";

export type UnifiedHistoryKind = "workflow" | "remark" | "atr";

export interface UnifiedHistoryItem {
  id: string;
  kind: UnifiedHistoryKind;
  createdAt: string;
  label: string;
  body: string | null;
  performerName: string | null;
  performerRole: string | null;
  workflowEntry?: DakHistoryEntry;
}

export function buildUnifiedHistory(
  timeline: DakHistoryEntry[],
  remarks: DakRemarkRecord[],
  atrRecords: DakAtrRecord[]
): UnifiedHistoryItem[] {
  const items: UnifiedHistoryItem[] = [];

  for (const entry of timeline) {
    items.push({
      id: `workflow-${entry.id}`,
      kind: "workflow",
      createdAt: entry.createdAt,
      label: entry.actionLabel,
      body: entry.remarks,
      performerName: entry.performerName,
      performerRole: entry.performerRole,
      workflowEntry: entry,
    });
  }

  for (const remark of remarks) {
    items.push({
      id: `remark-${remark.id}`,
      kind: "remark",
      createdAt: remark.createdAt,
      label: getRemarkTypeLabel(remark.remarkType),
      body: remark.body,
      performerName: remark.authorName,
      performerRole: remark.authorRole,
    });
  }

  for (const atr of atrRecords) {
    items.push({
      id: `atr-${atr.id}`,
      kind: "atr",
      createdAt: atr.submittedAt,
      label: "Action Taken Report",
      body: atr.actionTaken,
      performerName: atr.submitterName,
      performerRole: atr.submitterRole,
    });
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

interface CompleteHistoryTimelineProps {
  timeline: DakHistoryEntry[];
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
}

/** Merged chronological view of workflow, remarks, and ATR. */
export function CompleteHistoryTimeline({
  timeline,
  remarks,
  atrRecords,
}: CompleteHistoryTimelineProps) {
  const unified = buildUnifiedHistory(timeline, remarks, atrRecords);

  if (!unified.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No history recorded yet.
      </p>
    );
  }

  const workflowOnly = unified
    .filter((item) => item.kind === "workflow" && item.workflowEntry)
    .map((item) => item.workflowEntry!);

  if (workflowOnly.length === unified.length) {
    return <DakHistoryTimeline entries={workflowOnly} />;
  }

  return (
    <ol className="relative space-y-0 border-l border-primary/20 pl-6">
      {unified.map((item, index) => {
        const isLast = index === unified.length - 1;
        return (
          <li key={item.id} className={`relative pb-6 ${isLast ? "pb-0" : ""}`}>
            <span
              className={`absolute top-1 -left-[calc(0.75rem+1px)] size-3 rounded-full ring-4 ring-background ${
                isLast ? "bg-primary" : "bg-primary/40"
              }`}
            />
            <p className="text-sm font-medium">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDakDateTime(item.createdAt)}
              {item.performerName ? ` · ${item.performerName}` : ""}
            </p>
            {item.body?.trim() && (
              <p className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground">
                {item.body}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
