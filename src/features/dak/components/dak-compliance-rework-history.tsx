import { CheckCircle2, Clock, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ComplianceVersion,
  type ComplianceVersionStatus,
} from "@/features/dak/lib/compliance-rework";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ComplianceVersionStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  submitted: {
    label: "Submitted",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300",
    icon: Clock,
  },
  returned: {
    label: "Returned",
    className: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300",
    icon: RotateCcw,
  },
  awaiting_review: {
    label: "Awaiting Collector Review",
    className: "border-orange-500/30 bg-orange-500/10 text-orange-800 dark:text-orange-300",
    icon: Clock,
  },
  approved: {
    label: "Approved & Closed",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    icon: CheckCircle2,
  },
};

interface DakComplianceReworkHistoryProps {
  versions: ComplianceVersion[];
}

/** Read-only version history of all compliance submissions — nothing is overwritten. */
export function DakComplianceReworkHistory({
  versions,
}: DakComplianceReworkHistoryProps) {
  if (versions.length <= 1) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Rework History</CardTitle>
        <CardDescription>
          Complete audit trail of all compliance submissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {versions.map((entry) => {
          const config = STATUS_CONFIG[entry.status];
          const Icon = config.icon;

          return (
            <div
              key={entry.submission.id}
              className="rounded-lg border border-border/60 bg-muted/15 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Version {entry.version}</p>
                <Badge variant="outline" className={cn("gap-1", config.className)}>
                  <Icon className="size-3" />
                  {config.label}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {entry.submission.actionTaken}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Submitted {formatDakDateTime(entry.submission.submittedAt)}
                {entry.submission.submitterName
                  ? ` by ${entry.submission.submitterName}`
                  : ""}
              </p>
              {entry.status === "returned" && entry.returnReason && (
                <p className="mt-2 rounded-md border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-900 dark:text-red-200">
                  <span className="font-semibold">Return reason: </span>
                  {entry.returnReason}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
