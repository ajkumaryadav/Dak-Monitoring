"use client";

import { useActionState } from "react";
import {
  CalendarClock,
  Loader2,
  MessageCircle,
  RotateCcw,
  ArrowRightLeft,
} from "lucide-react";

import { reviewDakRequestFormAction } from "@/features/dak-requests/actions/review-dak-request";
import {
  DAK_REQUEST_BADGE_STYLES,
  DAK_REQUEST_PENDING_LABELS,
  DAK_REQUEST_TYPE_LABELS,
  type DakRequestType,
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
import { formatDakDate } from "@/features/dak/lib/dak-display";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "min-h-16 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

const REQUEST_ICONS: Record<DakRequestType, typeof MessageCircle> = {
  transfer: ArrowRightLeft,
  escalation: RotateCcw,
  extension: CalendarClock,
  clarification: MessageCircle,
};

function getRelatedName(
  value: { name: string } | { name: string }[] | null | undefined
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name;
}

interface PendingRequestCardProps {
  request: DakRequestRecord;
  currentDueDate?: string | null;
  currentDepartmentName?: string;
}

function PendingRequestCard({
  request,
  currentDueDate,
  currentDepartmentName,
}: PendingRequestCardProps) {
  const [state, formAction, isPending] = useActionState(
    reviewDakRequestFormAction,
    {}
  );

  const requesterName = getRelatedName(request.requester);
  const targetDept = getRelatedName(request.target_department);
  const Icon = REQUEST_ICONS[request.request_type];
  const isClarification = request.request_type === "clarification";
  const isExtension = request.request_type === "extension";
  const isTransfer = request.request_type === "transfer";

  return (
    <div className="rounded-lg border border-border/60 bg-background p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <p className="font-semibold">
          {DAK_REQUEST_TYPE_LABELS[request.request_type]}
        </p>
        <Badge
          variant="outline"
          className={cn(DAK_REQUEST_BADGE_STYLES[request.request_type])}
        >
          {DAK_REQUEST_PENDING_LABELS[request.request_type]}
        </Badge>
      </div>

      <dl className="mb-4 space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Requested by:</span>{" "}
          <span className="font-medium">{requesterName ?? "Department Officer"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Date:</span>{" "}
          {new Date(request.created_at).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        {isTransfer && (
          <>
            <div>
              <span className="text-muted-foreground">Current Department:</span>{" "}
              {currentDepartmentName ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Requested Department:</span>{" "}
              {targetDept ?? "—"}
            </div>
          </>
        )}

        {isExtension && (
          <>
            <div>
              <span className="text-muted-foreground">Current Due Date:</span>{" "}
              {formatDakDate(currentDueDate)}
            </div>
            <div>
              <span className="text-muted-foreground">Requested Due Date:</span>{" "}
              {formatDakDate(request.requested_due_date)}
            </div>
          </>
        )}

        <div>
          <span className="text-muted-foreground">
            {isClarification ? "Question:" : "Reason:"}
          </span>
          <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/30 p-2">
            {request.remarks}
          </p>
        </div>
      </dl>

      <form action={formAction} className="space-y-3 border-t border-border/60 pt-3">
        <input type="hidden" name="requestId" value={request.id} />
        <div className="space-y-2">
          <Label htmlFor={`reviewRemarks-${request.id}`}>
            {isClarification ? "Collector Reply *" : "Review Remarks *"}
          </Label>
          <textarea
            id={`reviewRemarks-${request.id}`}
            name="reviewRemarks"
            required
            minLength={5}
            rows={2}
            placeholder={
              isClarification
                ? "Enter your clarification reply to the department..."
                : "Enter decision and directions..."
            }
            className={inputClassName}
          />
        </div>

        {state.message && (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {isClarification ? (
            <button
              type="submit"
              name="decision"
              value="approved"
              disabled={isPending}
              className={cn(buttonVariants(), "h-10 gap-1.5 px-5")}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MessageCircle className="size-4" />
              )}
              Send Reply
            </button>
          ) : (
            <>
              <button
                type="submit"
                name="decision"
                value="approved"
                disabled={isPending}
                className={cn(buttonVariants(), "h-10 gap-1.5 px-5")}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isExtension ? (
                  "Approve Extension"
                ) : isTransfer ? (
                  "Approve Transfer"
                ) : (
                  "Approve"
                )}
              </button>
              <button
                type="submit"
                name="decision"
                value="rejected"
                disabled={isPending}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 gap-1.5 px-5"
                )}
              >
                {isExtension
                  ? "Reject Extension"
                  : isTransfer
                    ? "Reject Transfer"
                    : "Reject"}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

interface DakPendingRequestsPanelProps {
  requests: DakRequestRecord[];
  currentDueDate?: string | null;
  currentDepartmentName?: string;
}

/** Unified Collector panel for all pending department requests. */
export function DakPendingRequestsPanel({
  requests,
  currentDueDate,
  currentDepartmentName,
}: DakPendingRequestsPanelProps) {
  const pending = requests.filter((request) => request.status === "pending");
  if (!pending.length) return null;

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-primary/[0.03]">
        <CardTitle>Pending Requests</CardTitle>
        <CardDescription>
          Transfer, extension, clarification, and other requests requiring your decision
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {pending.map((request) => (
          <PendingRequestCard
            key={request.id}
            request={request}
            currentDueDate={currentDueDate}
            currentDepartmentName={currentDepartmentName}
          />
        ))}
      </CardContent>
    </Card>
  );
}
