"use client";

import { useActionState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

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
  submitAtrFormAction,
  type SubmitAtrFormState,
} from "@/features/remarks/actions/submit-atr";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type { DakAtrRecord } from "@/features/remarks/services/get-remarks";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

interface AtrPanelProps {
  dakId: string;
  atrRecords: DakAtrRecord[];
  permissions: RemarkPermissions;
}

export function AtrPanel({ dakId, atrRecords, permissions }: AtrPanelProps) {
  const [state, formAction, isPending] = useActionState(
    submitAtrFormAction,
    {} as SubmitAtrFormState
  );

  return (
    <div className="space-y-5">
      {permissions.canSubmitAtr && (
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Submit Action Taken Report</CardTitle>
            <CardDescription>
              Describe action taken and optionally attach supporting document (PDF, image, or Word).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
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
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
                Submit ATR
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Action Taken Reports</CardTitle>
          <CardDescription>
            {atrRecords.length
              ? `${atrRecords.length} submission${atrRecords.length === 1 ? "" : "s"}`
              : "No ATR submitted yet"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {!atrRecords.length ? (
            <p className="text-sm text-muted-foreground">
              No Action Taken Report has been submitted for this DAK.
            </p>
          ) : (
            <ul className="space-y-4">
              {atrRecords.map((atr) => (
                <li
                  key={atr.id}
                  className="rounded-lg border border-border/60 bg-muted/20 p-4"
                >
                  <p className="text-xs text-muted-foreground">
                    {formatDakDateTime(atr.submittedAt)}
                    {atr.submitterName ? ` · ${atr.submitterName}` : ""}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{atr.actionTaken}</p>
                  {atr.attachmentFileName && atr.attachmentDownloadUrl && (
                    <a
                      href={atr.attachmentDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "mt-3 gap-1.5"
                      )}
                    >
                      <Download className="size-3.5" />
                      {atr.attachmentFileName}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
