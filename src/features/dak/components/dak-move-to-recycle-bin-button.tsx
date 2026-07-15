"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { moveDakToRecycleBinAction } from "@/features/dak/actions/move-to-recycle-bin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DakMoveToRecycleBinButtonProps {
  dakId: string;
  dakNumber: string;
}

/**
 * Soft-delete entry point on DAK Details — moves the file to Recycle Bin.
 * Permanent deletion happens only from Database & Storage → Recycle Bin.
 */
export function DakMoveToRecycleBinButton({
  dakId,
  dakNumber,
}: DakMoveToRecycleBinButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmMove() {
    startTransition(async () => {
      const result = await moveDakToRecycleBinAction(dakId);
      // redirect() on success never returns; handle soft failures only
      if (result && result.success === false) {
        toast.error(result.message ?? "Could not move to Recycle Bin");
        return;
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        )}
      >
        <Trash2 className="size-3.5" />
        Delete DAK
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={() => !pending && setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recycle-bin-title"
            className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl"
          >
            <h2
              id="recycle-bin-title"
              className="text-base font-semibold text-foreground"
            >
              Are you sure?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will move <span className="font-medium text-foreground">{dakNumber}</span> to
              Recycle Bin. The DAK can be restored later. Nothing is permanently deleted yet.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
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
                  buttonVariants({ variant: "destructive", size: "sm" }),
                  "gap-1.5"
                )}
                onClick={confirmMove}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
