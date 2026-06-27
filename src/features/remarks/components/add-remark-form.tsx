"use client";

import { useActionState } from "react";
import { Loader2, MessageSquare } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  addRemarkFormAction,
  type AddRemarkFormState,
} from "@/features/remarks/actions/add-remark";
import { getRemarkTypeLabel } from "@/features/remarks/lib/remark-types";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

interface AddRemarkFormProps {
  dakId: string;
  permissions: RemarkPermissions;
}

/** Form to add remarks, internal notes, or department remarks based on role. */
export function AddRemarkForm({ dakId, permissions }: AddRemarkFormProps) {
  const [state, formAction, isPending] = useActionState(
    addRemarkFormAction,
    {} as AddRemarkFormState
  );

  const defaultType = permissions.allowedRemarkTypes[0];
  if (!defaultType) return null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="dakId" value={dakId} />

      {permissions.allowedRemarkTypes.length > 1 ? (
        <div className="space-y-2">
          <Label htmlFor="remarkType">Type</Label>
          <select
            id="remarkType"
            name="remarkType"
            defaultValue={defaultType}
            className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
          >
            {permissions.allowedRemarkTypes.map((type) => (
              <option key={type} value={type}>
                {getRemarkTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="remarkType" value={defaultType} />
      )}

      <div className="space-y-2">
        <Label htmlFor="body">Remark</Label>
        <textarea
          id="body"
          name="body"
          required
          maxLength={2000}
          placeholder="Enter your remark..."
          className={inputClassName}
        />
      </div>

      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-600">Remark saved.</p>
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
        Save Remark
      </button>
    </form>
  );
}
