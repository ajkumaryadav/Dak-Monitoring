import Link from "next/link";
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
  getHistoryEventLabel,
  type DakHistoryEventType,
} from "@/features/audit/lib/history-events";
import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import { cn } from "@/lib/utils";

interface RecentActivityWidgetProps {
  entries: DakHistoryEntry[];
  viewAllHref?: string;
}

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

export function RecentActivityWidget({
  entries,
  viewAllHref = "/dashboard/audit",
}: RecentActivityWidgetProps) {
  if (!entries.length) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No recent activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {entries.map((entry) => {
          const Icon = eventIcons[entry.eventType] ?? Clock;

          return (
            <li
              key={entry.id}
              className="flex gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {getHistoryEventLabel(entry.eventType)}
                  </Badge>
                  {entry.dakNumber ? (
                    <Link
                      href={`/dashboard/dak/${entry.dakId}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {entry.dakNumber}
                    </Link>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-foreground">{entry.actionLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDakDateTime(entry.createdAt)}
                  {entry.performerName ? ` · ${entry.performerName}` : ""}
                </p>
                {entry.remarks?.trim() ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {entry.remarks}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <Link
        href={viewAllHref}
        className={cn(
          "inline-flex text-sm font-medium text-primary hover:underline"
        )}
      >
        View full audit log →
      </Link>
    </div>
  );
}
