import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type { CollectorReturnNotice } from "@/features/dak/lib/compliance-rework";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";

interface DakCollectorReturnNoticeProps {
  notice: CollectorReturnNotice;
}

/** Prominent banner when Collector returns DAK for rework — visible until resubmission. */
export function DakCollectorReturnNotice({ notice }: DakCollectorReturnNoticeProps) {
  return (
    <Card className="border-red-500/50 bg-gradient-to-br from-amber-50 via-amber-50/80 to-red-50/60 shadow-sm dark:from-amber-950/30 dark:via-amber-950/20 dark:to-red-950/20">
      <CardContent className="pt-5 pb-5">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-amber-950 dark:text-amber-100">
                ⚠ {notice.title}
              </p>
              <Badge
                variant="outline"
                className="border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300"
              >
                {notice.statusLabel}
              </Badge>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-amber-900/70 dark:text-amber-200/70">
                  Returned On
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-amber-950 dark:text-amber-50">
                  {formatDakDateTime(notice.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-amber-900/70 dark:text-amber-200/70">
                  Status
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-amber-950 dark:text-amber-50">
                  {notice.statusLabel}
                </dd>
              </div>
            </dl>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/70 dark:text-amber-200/70">
                Reason
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg border border-amber-500/30 bg-white/60 p-3 text-sm leading-relaxed text-amber-950 dark:bg-black/20 dark:text-amber-50">
                {notice.body}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
