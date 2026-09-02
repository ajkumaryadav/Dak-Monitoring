"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { reforwardDak } from "@/features/dak/actions/reforward-dak";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DakReforwardButtonProps {
  dakId: string;
  dakNumber: string;
  className?: string;
  asCard?: boolean;
}

/**
 * Re-forward button for DAK Operator to submit a recalled DAK back to Collector/ADM.
 */
export function DakReforwardButton({
  dakId,
  dakNumber,
  className,
  asCard = false,
}: DakReforwardButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleReforward() {
    startTransition(async () => {
      const result = await reforwardDak({ dakId });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  if (asCard) {
    return (
      <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-3.5 shadow-sm sm:p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
            <Send className="size-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Forward DAK to Collector
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This DAK is currently in your registry. Once your corrections are ready, forward it to the Collector/ADM for examination and department allocation.
            </p>
            <div className="mt-3">
              <button
                type="button"
                disabled={pending}
                onClick={handleReforward}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Forward to Collector Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleReforward}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "gap-1.5 border-primary/40 text-primary hover:bg-primary/10",
        className
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Send className="size-3.5" />
      )}
      Forward to Collector
    </button>
  );
}
