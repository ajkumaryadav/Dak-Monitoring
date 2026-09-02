"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { recallDak } from "@/features/dak/actions/recall-dak";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DakRecallButtonProps {
  dakId: string;
  dakNumber: string;
  status: string;
  className?: string;
  asCard?: boolean;
}

/**
 * Recall DAK button and confirmation dialog for DAK Operator.
 * Allows pulling back an accidentally forwarded or assigned DAK to registry intake.
 */
export function DakRecallButton({
  dakId,
  dakNumber,
  status,
  className,
  asCard = false,
}: DakRecallButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const isRecallable = ["received", "assigned", "under_process", "in_progress"].includes(status);

  if (!isRecallable) {
    return null;
  }

  function handleRecall() {
    startTransition(async () => {
      const result = await recallDak({
        dakId,
        reason: reason.trim() || "Accidental forwarding / correction of registry details",
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      setReason("");
    });
  }

  if (asCard) {
    return (
      <>
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5 shadow-sm sm:p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <RotateCcw className="size-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                Recall DAK to Registry
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                If you accidentally forwarded this DAK to the Collector/ADM or department, you can recall it to your intake registry to correct details or replace attachments.
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "gap-1.5 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
                  )}
                >
                  <RotateCcw className="size-3.5" />
                  Recall DAK Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {open && renderDialog()}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-1.5 border-amber-500/40 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300",
          className
        )}
      >
        <RotateCcw className="size-3.5" />
        Recall DAK
      </button>

      {open && renderDialog()}
    </>
  );

  function renderDialog() {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => !pending && setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recall-dak-title"
          className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl"
        >
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-5 shrink-0" />
            <h2 id="recall-dak-title" className="text-base font-semibold text-foreground">
              Recall DAK to Registry?
            </h2>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            This will pull <span className="font-semibold text-foreground">{dakNumber}</span> back to your intake registry, reset any active assignments, and allow you to make necessary corrections.
          </p>

          <div className="mt-4 space-y-1.5">
            <label
              htmlFor="recall-reason"
              className="text-xs font-medium text-foreground"
            >
              Reason for Recall (Optional)
            </label>
            <Textarea
              id="recall-reason"
              placeholder="e.g. Accidental forward to Collector, incorrect document attached, typo in applicant details..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={pending}
              className="text-xs resize-none"
            />
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border/50 pt-4">
            <button
              type="button"
              disabled={pending}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className={cn(
                buttonVariants({ size: "sm" }),
                "gap-1.5 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
              )}
              onClick={handleRecall}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              Confirm Recall
            </button>
          </div>
        </div>
      </div>
    );
  }
}
