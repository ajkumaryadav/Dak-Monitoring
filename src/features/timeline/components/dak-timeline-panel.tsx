"use client";

import {
  ArrowRightLeft,
  Clock,
  FilePlus2,
  FileUp,
  Gauge,
  MessageSquare,
  Paperclip,
  ShieldAlert,
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
import { formatDakDateTime, formatDakStatus } from "@/features/dak/lib/dak-display";
import {
  getTimelineActionLabel,
  type DakTimelineActionType,
} from "@/features/timeline/lib/timeline-types";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import { cn } from "@/lib/utils";

const actionIcons: Record<DakTimelineActionType, typeof Clock> = {
  dak_created: FilePlus2,
  dak_assigned: UserPlus,
  dak_reassigned: ArrowRightLeft,
  status_changed: Clock,
  remark_added: MessageSquare,
  file_uploaded: Paperclip,
  atr_submitted: FileUp,
  closed: XCircle,
  sla_assigned: Gauge,
  sla_expired: Clock,
  escalated: ShieldAlert,
};

const actionStyles: Record<DakTimelineActionType, string> = {
  dak_created: "bg-primary/15 text-primary border-primary/25",
  dak_assigned: "border-[oklch(0.45_0.11_240)]/30 bg-[oklch(0.45_0.11_240)]/10 text-[oklch(0.38_0.11_240)]",
  dak_reassigned: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  status_changed: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  remark_added: "border-border bg-muted text-muted-foreground",
  file_uploaded: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  atr_submitted: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  closed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  sla_assigned: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  sla_expired: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  escalated: "border-red-950/40 bg-red-950/15 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
};

interface DakTimelinePanelProps {
  events: DakTimelineEvent[];
  title?: string;
  description?: string;
  compact?: boolean;
}

export function DakTimelinePanel({
  events,
  title = "DAK Timeline",
  description = "Complete chronological history of this DAK",
  compact = false,
}: DakTimelinePanelProps) {
  const content = !events.length ? (
    <p className="py-6 text-center text-sm text-muted-foreground">
      No timeline events recorded yet.
    </p>
  ) : (
    <ol className="relative space-y-0 border-l border-primary/20 pl-6">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const Icon = actionIcons[event.actionType] ?? Clock;
        const fromStatus = event.metadata.from_status as string | undefined;
        const toStatus = event.metadata.to_status as string | undefined;

        return (
          <li key={event.id} className={cn("relative pb-6", isLast && "pb-0")}>
            <span
              className={cn(
                "absolute top-1 -left-[calc(0.75rem+1px)] flex size-3 items-center justify-center rounded-full ring-4 ring-background",
                isLast ? "bg-primary" : "bg-primary/40"
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("gap-1 capitalize", actionStyles[event.actionType])}
              >
                <Icon className="size-3" />
                {getTimelineActionLabel(event.actionType)}
              </Badge>
              <p className="text-sm font-medium text-foreground">
                {event.actionTitle}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDakDateTime(event.createdAt)}
              {event.performerName ? (
                <>
                  {" · "}
                  <span className="font-medium text-foreground/80">
                    {event.performerName}
                  </span>
                  {event.performerRole
                    ? ` (${event.performerRole.replace(/_/g, " ")})`
                    : ""}
                </>
              ) : null}
            </p>
            {(fromStatus || toStatus) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {fromStatus ? formatDakStatus(fromStatus) : "—"} →{" "}
                {toStatus ? formatDakStatus(toStatus) : "—"}
              </p>
            )}
            {event.description?.trim() && (
              <p className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground">
                {event.description}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );

  if (compact) {
    return content;
  }

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-muted/40 via-background to-background">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock className="size-4" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">{content}</CardContent>
    </Card>
  );
}
