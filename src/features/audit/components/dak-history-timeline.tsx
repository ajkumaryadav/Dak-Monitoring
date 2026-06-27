import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  UserPlus,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getHistoryEventLabel,
  type DakHistoryEventType,
} from "@/features/audit/lib/history-events";
import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { formatDakDateTime, formatDakStatus } from "@/features/dak/lib/dak-display";
import { cn } from "@/lib/utils";

interface DakHistoryTimelineProps {
  entries: DakHistoryEntry[];
}

const eventStyles: Record<DakHistoryEventType, string> = {
  dak_registered: "bg-primary/15 text-primary border-primary/25",
  assigned: "border-[oklch(0.45_0.11_240)]/30 bg-[oklch(0.45_0.11_240)]/10 text-[oklch(0.38_0.11_240)]",
  reassigned: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  status_changed: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  section_transfer: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  remarks_added: "border-border bg-muted text-muted-foreground",
  atr_submitted: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  closed: "border-border bg-muted text-muted-foreground",
};

const eventIcons: Record<DakHistoryEventType, typeof Clock> = {
  dak_registered: FileText,
  assigned: UserPlus,
  reassigned: ArrowRightLeft,
  status_changed: Clock,
  section_transfer: ArrowRightLeft,
  remarks_added: MessageSquare,
  atr_submitted: FileText,
  completed: CheckCircle2,
  closed: XCircle,
};

export function DakHistoryTimeline({ entries }: DakHistoryTimelineProps) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-muted/40 via-background to-background">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock className="size-4" />
          </div>
          <div>
            <CardTitle>Timeline & Audit History</CardTitle>
            <CardDescription>
              Complete workflow trail with remarks and responsible officers
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!entries.length ? (
          <p className="text-sm text-muted-foreground">
            No workflow events recorded yet.
          </p>
        ) : (
          <ol className="relative space-y-0 border-l border-primary/20 pl-6">
            {entries.map((entry, index) => {
              const isLast = index === entries.length - 1;
              const Icon = eventIcons[entry.eventType] ?? Clock;

              return (
                <li
                  key={entry.id}
                  className={cn("relative pb-6", isLast && "pb-0")}
                >
                  <span
                    className={cn(
                      "absolute top-1 -left-[calc(0.75rem+1px)] flex size-3 items-center justify-center rounded-full ring-4 ring-background",
                      isLast ? "bg-primary" : "bg-primary/40"
                    )}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("gap-1 capitalize", eventStyles[entry.eventType])}
                    >
                      <Icon className="size-3" />
                      {getHistoryEventLabel(entry.eventType)}
                    </Badge>
                    <p className="text-sm font-medium text-foreground">
                      {entry.actionLabel}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDakDateTime(entry.createdAt)}
                    {entry.performerName ? (
                      <>
                        {" · "}
                        <span className="font-medium text-foreground/80">
                          {entry.performerName}
                        </span>
                        {entry.performerRole
                          ? ` (${entry.performerRole.replace(/_/g, " ")})`
                          : ""}
                      </>
                    ) : null}
                  </p>
                  {(entry.fromStatus || entry.toStatus) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.fromStatus
                        ? formatDakStatus(entry.fromStatus)
                        : "—"}{" "}
                      →{" "}
                      {entry.toStatus ? formatDakStatus(entry.toStatus) : "—"}
                    </p>
                  )}
                  {entry.remarks?.trim() && (
                    <p className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      {entry.remarks}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/** @deprecated Use DakHistoryTimeline */
export const DakTimeline = DakHistoryTimeline;
