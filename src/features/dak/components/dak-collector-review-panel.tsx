"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

import {
  approveClosureFormAction,
  returnForReworkFormAction,
  type ClosureFormState,
} from "@/features/dak/actions/approve-closure";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const textareaClassName = cn(
  "min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

interface DakCollectorReviewPanelProps {
  dakId: string;
}

/** Collector decision panel — the only editable section on the review page. */
export function DakCollectorReviewPanel({ dakId }: DakCollectorReviewPanelProps) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveClosureFormAction,
    {} as ClosureFormState
  );
  const [returnState, returnAction, returnPending] = useActionState(
    returnForReworkFormAction,
    {} as ClosureFormState
  );
  const [returnValidation, setReturnValidation] = useState<string | null>(null);

  const isPending = approvePending || returnPending;
  const feedbackMessage = returnState.message ?? approveState.message ?? returnValidation;

  return (
    <Card className="border-emerald-600/20 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-emerald-500/[0.04]">
        <CardTitle>Collector&apos;s Decision</CardTitle>
        <CardDescription>
          Review the submission above, then approve closure or return for rework
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <form action={approveAction} className="space-y-5">
          <input type="hidden" name="dakId" value={dakId} />

          <div className="space-y-2">
            <Label htmlFor="collectorReviewRemark" className="text-sm font-semibold">
              Collector Review Remark
            </Label>
            <p className="text-xs text-muted-foreground">
              Optional when approving. Required when returning for rework — the
              department will see this reason.
            </p>
            <textarea
              id="collectorReviewRemark"
              name="remarks"
              rows={4}
              placeholder="Enter review observations or corrections required..."
              className={textareaClassName}
            />
          </div>

          {feedbackMessage && (
            <p className="text-sm text-destructive" role="alert">
              {feedbackMessage}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isPending}
              className={cn(buttonVariants(), "h-12 flex-1 gap-2 text-base")}
            >
              {approvePending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
              Approve &amp; Close
            </button>

            <button
              type="submit"
              formAction={returnAction}
              disabled={isPending}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 flex-1 gap-2 border-amber-500/40 text-base hover:bg-amber-500/[0.06]"
              )}
              onClick={(event) => {
                const textarea = document.getElementById(
                  "collectorReviewRemark"
                ) as HTMLTextAreaElement | null;
                const value = textarea?.value.trim() ?? "";
                if (value.length < 5) {
                  event.preventDefault();
                  setReturnValidation(
                    "Please enter a Collector Review Remark explaining what corrections are required (minimum 5 characters)."
                  );
                  return;
                }
                setReturnValidation(null);
              }}
            >
              {returnPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <RotateCcw className="size-5" />
              )}
              Return for Rework
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
