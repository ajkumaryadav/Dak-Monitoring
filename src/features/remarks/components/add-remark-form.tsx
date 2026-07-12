"use client";

import { useActionState } from "react";
import { Loader2, MessageSquare } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  addRemarkFormAction,
  type AddRemarkFormState,
} from "@/features/remarks/actions/add-remark";
import type { DakRemarkType } from "@/features/remarks/lib/remark-types";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

function getRemarkFieldLabel(type: DakRemarkType): string {
  switch (type) {
    case "collector_note":
      return "Collector Review Remark";
    case "internal_note":
      return "Internal Note";
    case "department_remark":
      return "Department Remark";
    default:
      return "Remark";
  }
}

interface AddRemarkFormProps {
  dakId: string;
  permissions: RemarkPermissions;
}

/** Form to add remarks based on role — remark type is inferred automatically. */
export function AddRemarkForm({ dakId, permissions }: AddRemarkFormProps) {
  const [state, formAction, isPending] = useActionState(
    addRemarkFormAction,
    {} as AddRemarkFormState
  );

  const remarkType = permissions.allowedRemarkTypes[0];
  if (!remarkType) return null;

  const fieldLabel = getRemarkFieldLabel(remarkType);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="dakId" value={dakId} />
      <input type="hidden" name="remarkType" value={remarkType} />

      <div className="space-y-2">
        <Label htmlFor="body">{fieldLabel}</Label>
        <textarea
          id="body"
          name="body"
          required
          maxLength={2000}
          placeholder={`Enter ${fieldLabel.toLowerCase()}...`}
          className={inputClassName}
        />
      </div>

      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-600">{fieldLabel} saved.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(buttonVariants(), "gap-2")}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MessageSquare className="size-4" />
        )}
        Save {fieldLabel}
      </button>
    </form>
  );
}
