import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DAK_REQUEST_STATUS_LABELS,
} from "@/features/dak-requests/lib/request-types";
import type { DakRequestRecord } from "@/features/dak-requests/services/dak-requests";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";

function getRelatedName(
  value: { name: string } | { name: string }[] | null | undefined
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name;
}

interface DakClarificationExchangeProps {
  requests: DakRequestRecord[];
}

/** Dedicated Q&A section for clarification requests — separate from correspondence. */
export function DakClarificationExchange({
  requests,
}: DakClarificationExchangeProps) {
  const clarifications = requests.filter(
    (request) => request.request_type === "clarification"
  );

  if (!clarifications.length) {
    return null;
  }

  return (
    <Card className="border-blue-500/25">
      <CardHeader className="border-b border-border/60 bg-blue-500/[0.04]">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="size-4 text-blue-600 dark:text-blue-400" />
          Clarification Exchange
        </CardTitle>
        <CardDescription>
          Questions and replies between Department and Collector
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {clarifications.map((request) => {
          const requesterName = getRelatedName(request.requester);
          const isPending = request.status === "pending";

          return (
            <div
              key={request.id}
              className="space-y-3 rounded-lg border border-blue-500/20 bg-blue-500/[0.03] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    isPending
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  }
                >
                  {isPending
                    ? "Awaiting Collector Reply"
                    : DAK_REQUEST_STATUS_LABELS[request.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDakDateTime(request.created_at)}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Question asked by Department
                  {requesterName ? ` (${requesterName})` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {request.remarks}
                </p>
              </div>

              {request.review_remarks && (
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                    Collector Reply
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                    {request.review_remarks}
                  </p>
                  {request.reviewed_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Replied {formatDakDateTime(request.reviewed_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
