"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

import {
  approveClosureFormAction,
  returnForReworkFormAction,
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

const inputClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none md:text-sm"
);

interface DakApprovalPanelProps {
  dakId: string;
}

export function DakApprovalPanel({ dakId }: DakApprovalPanelProps) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveClosureFormAction,
    {}
  );
  const [returnState, returnAction, returnPending] = useActionState(
    returnForReworkFormAction,
    {}
  );

  return (
    <Card className="border-emerald-500/25">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">ATR Review</CardTitle>
        <CardDescription>
          Approve closure or return to department for correction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <form action={approveAction} className="space-y-3 rounded-lg border p-3">
          <input type="hidden" name="dakId" value={dakId} />
          <Label htmlFor="approveRemarks">Approval remarks (optional)</Label>
          <textarea
            id="approveRemarks"
            name="remarks"
            rows={2}
            className={cn(inputClassName, "min-h-16 resize-y py-2")}
            placeholder="Verified — approve closure"
          />
          {approveState.message && (
            <p className="text-sm text-destructive">{approveState.message}</p>
          )}
          <button
            type="submit"
            disabled={approvePending}
            className={cn(buttonVariants(), "h-9 w-full gap-1.5")}
          >
            {approvePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Approve Closure
          </button>
        </form>

        <form action={returnAction} className="space-y-3 rounded-lg border p-3">
          <input type="hidden" name="dakId" value={dakId} />
          <Label htmlFor="returnRemarks">Return remarks *</Label>
          <textarea
            id="returnRemarks"
            name="remarks"
            required
            minLength={5}
            rows={2}
            className={cn(inputClassName, "min-h-16 resize-y py-2")}
            placeholder="Specify corrections required..."
          />
          {returnState.message && (
            <p className="text-sm text-destructive">{returnState.message}</p>
          )}
          <button
            type="submit"
            disabled={returnPending}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 w-full gap-1.5"
            )}
          >
            {returnPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Return for Rework
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
