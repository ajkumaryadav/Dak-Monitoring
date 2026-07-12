import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DAK_REQUEST_BADGE_STYLES,
  DAK_REQUEST_PENDING_LABELS,
  DAK_REQUEST_STATUS_LABELS,
  DAK_REQUEST_TYPE_LABELS,
} from "@/features/dak-requests/lib/request-types";
import type { DakRequestRecord } from "@/features/dak-requests/services/dak-requests";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import { cn } from "@/lib/utils";

interface DakDepartmentRequestStatusProps {
  requests: DakRequestRecord[];
}

function getRelatedName(
  value: { name: string } | { name: string }[] | null | undefined
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name;
}

/** Shows department officers the status of their submitted requests. */
export function DakDepartmentRequestStatus({
  requests,
}: DakDepartmentRequestStatusProps) {
  const nonClarification = requests.filter(
    (request) => request.request_type !== "clarification"
  );

  if (!nonClarification.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Your Requests</CardTitle>
        <CardDescription>
          Status of transfer, extension, and escalation requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {nonClarification.map((request) => {
          const targetDept = getRelatedName(request.target_department);
          const isPending = request.status === "pending";

          return (
            <div
              key={request.id}
              className="rounded-lg border border-border/60 bg-muted/15 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(DAK_REQUEST_BADGE_STYLES[request.request_type])}
                >
                  {DAK_REQUEST_TYPE_LABELS[request.request_type]}
                </Badge>
                <Badge variant="secondary">
                  {isPending
                    ? DAK_REQUEST_PENDING_LABELS[request.request_type]
                    : DAK_REQUEST_STATUS_LABELS[request.status]}
                </Badge>
              </div>
              <p className="mt-2 text-sm">{request.remarks}</p>
              {targetDept && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Requested department: {targetDept}
                </p>
              )}
              {request.requested_due_date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Requested due date: {request.requested_due_date}
                </p>
              )}
              {request.review_remarks && (
                <p className="mt-2 rounded-md bg-background p-2 text-xs">
                  <span className="font-semibold">Collector decision: </span>
                  {request.review_remarks}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Submitted {formatDakDateTime(request.created_at)}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
