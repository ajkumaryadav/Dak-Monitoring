import { Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import type { DakTimelineEntry } from "@/features/dak/services/get-dak-by-id";
import { cn } from "@/lib/utils";

interface DakTimelineProps {
  entries: DakTimelineEntry[];
}

export function DakTimeline({ entries }: DakTimelineProps) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-muted/40 via-background to-background">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock className="size-4" />
          </div>
          <div>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>
              Workflow history from registration to completion
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

              return (
                <li
                  key={entry.id}
                  className={cn("relative pb-6", isLast && "pb-0")}
                >
                  <span
                    className={cn(
                      "absolute top-1 -left-[calc(0.75rem+1px)] size-3 rounded-full ring-4 ring-background",
                      isLast ? "bg-primary" : "bg-primary/40"
                    )}
                  />
                  <p className="text-sm font-medium text-foreground">
                    {entry.action}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDakDateTime(entry.created_at)}
                    {entry.actor_name ? ` · ${entry.actor_name}` : ""}
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
        )}
      </CardContent>
    </Card>
  );
}
