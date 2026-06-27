"use client";

import { useActionState } from "react";
import { Loader2, MessageSquare } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  addRemarkFormAction,
  type AddRemarkFormState,
} from "@/features/remarks/actions/add-remark";
import { getRemarkTypeLabel } from "@/features/remarks/lib/remark-types";
import type { DakRemarkType } from "@/features/remarks/lib/remark-types";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type { DakRemarkRecord } from "@/features/remarks/services/get-remarks";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

interface RemarksPanelProps {
  dakId: string;
  remarks: DakRemarkRecord[];
  permissions: RemarkPermissions;
}

export function RemarksPanel({ dakId, remarks, permissions }: RemarksPanelProps) {
  const [state, formAction, isPending] = useActionState(
    addRemarkFormAction,
    {} as AddRemarkFormState
  );

  const canAdd = permissions.allowedRemarkTypes.length > 0;
  const defaultType = permissions.allowedRemarkTypes[0];

  return (
    <div className="space-y-5">
      {canAdd && defaultType && (
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Add Remark</CardTitle>
            <CardDescription>
              {permissions.canAddInternalNote
                ? "Add internal or collector notes visible to district administration."
                : permissions.canAddDepartmentRemark
                  ? "Add department remarks on this DAK."
                  : "Add remarks on this DAK."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="dakId" value={dakId} />

              {permissions.allowedRemarkTypes.length > 1 ? (
                <div className="space-y-2">
                  <Label htmlFor="remarkType">Remark Type</Label>
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
          </CardContent>
        </Card>
      )}

      {permissions.isReadOnly && (
        <p className="text-sm text-muted-foreground">
          You have read-only access to remarks on this DAK.
        </p>
      )}

      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Remarks History</CardTitle>
          <CardDescription>
            {remarks.length
              ? `${remarks.length} remark${remarks.length === 1 ? "" : "s"}`
              : "No remarks yet"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {!remarks.length ? (
            <p className="text-sm text-muted-foreground">No remarks recorded.</p>
          ) : (
            <ul className="space-y-4">
              {remarks.map((remark) => (
                <li
                  key={remark.id}
                  className="rounded-lg border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {getRemarkTypeLabel(remark.remarkType)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDakDateTime(remark.createdAt)}
                      {remark.authorName ? ` · ${remark.authorName}` : ""}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{remark.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
