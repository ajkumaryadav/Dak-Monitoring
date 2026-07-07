"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { reviewDakRequestFormAction } from "@/features/dak-requests/actions/review-dak-request";
import {
  DAK_REQUEST_STATUS_LABELS,
  DAK_REQUEST_TYPE_LABELS,
} from "@/features/dak-requests/lib/request-types";
import type { DakRequestRecord } from "@/features/dak-requests/services/dak-requests";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none md:text-sm"
);

function getRelatedName(
  value: { name: string } | { name: string }[] | null | undefined
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name;
}

interface DakRequestReviewPanelProps {
  requests: DakRequestRecord[];
}

function PendingRequestReviewForm({ request }: { request: DakRequestRecord }) {
  const [state, formAction, isPending] = useActionState(
    reviewDakRequestFormAction,
    {}
  );

  const requesterName = getRelatedName(request.requester);
  const targetDept = getRelatedName(request.target_department);

  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="font-medium">
          {DAK_REQUEST_TYPE_LABELS[request.request_type]}
        </p>
        <Badge variant="outline">
          {DAK_REQUEST_STATUS_LABELS[request.status]}
        </Badge>
      </div>

      <dl className="mb-3 space-y-1 text-sm">
        <div>
          <span className="text-muted-foreground">Requested by:</span>{" "}
          {requesterName ?? "—"}
        </div>
        {targetDept && (
          <div>
            <span className="text-muted-foreground">Target department:</span>{" "}
            {targetDept}
          </div>
        )}
        {request.requested_due_date && (
          <div>
            <span className="text-muted-foreground">Requested due date:</span>{" "}
            {request.requested_due_date}
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Remarks:</span> {request.remarks}
        </div>
      </dl>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="requestId" value={request.id} />
        <div className="space-y-2">
          <Label htmlFor={`reviewRemarks-${request.id}`}>Review Remarks *</Label>
          <textarea
            id={`reviewRemarks-${request.id}`}
            name="reviewRemarks"
            required
            minLength={5}
            rows={2}
            placeholder="Collector/ADM decision and directions..."
            className={cn(inputClassName, "min-h-16 resize-y py-2")}
          />
        </div>
        {state.message && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="decision"
            value="approved"
            disabled={isPending}
            className={cn(buttonVariants(), "h-9 px-4")}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Approve"}
          </button>
          <button
            type="submit"
            name="decision"
            value="rejected"
            disabled={isPending}
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
          >
            Reject
          </button>
        </div>
      </form>
    </div>
  );
}

export function DakRequestReviewPanel({ requests }: DakRequestReviewPanelProps) {
  const pending = requests.filter((r) => r.status === "pending");
  if (!pending.length) return null;

  return (
    <Card className="border-amber-500/30">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Pending Department Requests</CardTitle>
        <CardDescription>
          Review transfer, escalation, and extension requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {pending.map((request) => (
          <PendingRequestReviewForm key={request.id} request={request} />
        ))}
      </CardContent>
    </Card>
  );
}
