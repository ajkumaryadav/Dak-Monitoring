"use client";

import { useActionState } from "react";
import { FileText, Loader2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  submitAtrFormAction,
  type SubmitAtrFormState,
} from "@/features/remarks/actions/submit-atr";
import { ALLOWED_ATTACHMENT_ACCEPT } from "@/features/dak/lib/attachment-validation";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

interface AtrFormProps {
  dakId: string;
}

/** Submit Action Taken Report with optional attachment upload. */
export function AtrForm({ dakId }: AtrFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitAtrFormAction,
    {} as SubmitAtrFormState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="dakId" value={dakId} />

      <div className="space-y-2">
        <Label htmlFor="actionTaken">Action Taken</Label>
        <textarea
          id="actionTaken"
          name="actionTaken"
          required
          minLength={10}
          maxLength={5000}
          placeholder="Describe the action taken on this DAK..."
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachment">ATR Attachment (optional)</Label>
        <input
          id="attachment"
          name="attachment"
          type="file"
          accept={ALLOWED_ATTACHMENT_ACCEPT}
          className="block w-full text-sm"
        />
      </div>

      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-600">ATR submitted successfully.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants(), "gap-2")}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileText className="size-4" />
        )}
        Submit ATR for Approval
      </button>
    </form>
  );
}
