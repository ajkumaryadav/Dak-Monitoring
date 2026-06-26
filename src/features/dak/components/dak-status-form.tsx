"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import {
  updateDakStatusFormAction,
  type UpdateDakStatusFormState,
} from "@/features/dak/actions/update-dak-status";
import { getStatusLabel } from "@/features/dak/lib/workflow";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { DakStatus } from "@/types";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive md:text-sm dark:bg-input/30"
);

const initialState: UpdateDakStatusFormState = {};

interface DakStatusFormProps {
  dakId: string;
  currentStatus: DakStatus;
  allowedTransitions: DakStatus[];
}

export function DakStatusForm({
  dakId,
  currentStatus,
  allowedTransitions,
}: DakStatusFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateDakStatusFormAction,
    initialState
  );

  if (!allowedTransitions.length) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Workflow Status</CardTitle>
          <CardDescription>
            This DAK is {getStatusLabel(currentStatus).toLowerCase()} and cannot
            be advanced further.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.03] via-background to-background">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Update Status</CardTitle>
        <CardDescription>
          Advance this DAK through the district workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="dakId" value={dakId} />

          <div className="space-y-2">
            <Label htmlFor="status">Next Status</Label>
            <select
              id="status"
              name="status"
              required
              defaultValue=""
              className={inputClassName}
              aria-invalid={!!state.errors?.status}
            >
              <option value="" disabled>
                Select next status
              </option>
              {allowedTransitions.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
            {state.errors?.status?.[0] && (
              <p className="text-xs text-destructive">{state.errors.status[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (optional)</Label>
            <textarea
              id="remarks"
              name="remarks"
              placeholder="Add a note for the timeline log..."
              rows={3}
              maxLength={500}
              className={cn(inputClassName, "min-h-20 resize-y py-2")}
              aria-invalid={!!state.errors?.remarks}
            />
            {state.errors?.remarks?.[0] && (
              <p className="text-xs text-destructive">
                {state.errors.remarks[0]}
              </p>
            )}
          </div>

          {state.message && (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={cn(buttonVariants(), "h-9 w-full sm:w-auto")}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
