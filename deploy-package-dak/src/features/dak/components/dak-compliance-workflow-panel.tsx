"use client";

import { useActionState, useMemo, useState } from "react";
import { FileUp, Loader2, Save } from "lucide-react";

import {
  saveComplianceDraftFormAction,
  submitComplianceFormAction,
} from "@/features/dak/actions/compliance-actions";
import { ALLOWED_ATTACHMENT_ACCEPT } from "@/features/dak/lib/attachment-validation";
import {
  canEditCompliance,
  isComplianceReadOnly,
} from "@/features/dak/lib/compliance-workflow";
import type { ComplianceDraftRecord } from "@/features/remarks/services/get-remarks";
import type { DakAtrRecord } from "@/features/remarks/services/get-remarks";
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

const textareaClassName = cn(
  "min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

interface DakComplianceWorkflowPanelProps {
  dakId: string;
  status: string;
  draft: ComplianceDraftRecord | null;
  submittedRecords: DakAtrRecord[];
}

export function DakComplianceWorkflowPanel({
  dakId,
  status,
  draft,
  submittedRecords,
}: DakComplianceWorkflowPanelProps) {
  const readOnly = isComplianceReadOnly(status);
  const canEdit = canEditCompliance(status);

  const initialSummary =
    draft?.actionTaken &&
    !draft.actionTaken.startsWith("Draft — action summary pending")
      ? draft.actionTaken
      : "";

  const [actionTaken, setActionTaken] = useState(initialSummary);
  const [atrFileName, setAtrFileName] = useState<string | null>(
    draft?.attachmentFileName ?? null
  );
  const [atrSelected, setAtrSelected] = useState(false);

  const [draftState, draftAction, draftPending] = useActionState(
    saveComplianceDraftFormAction,
    {}
  );
  const [submitState, submitAction, submitPending] = useActionState(
    submitComplianceFormAction,
    {}
  );

  const hasExistingAtr = !!draft?.attachmentFileName || atrSelected;
  const canSubmit =
    actionTaken.trim().length >= 10 && hasExistingAtr && canEdit && !readOnly;

  const latestSubmission = submittedRecords[0];

  const helperMessage = useMemo(() => {
    if (readOnly && latestSubmission) {
      return "Your compliance has been submitted. The Collector will review and close this DAK.";
    }
    if (canEdit) {
      return "Complete all mandatory fields, then submit compliance to the Collector. You cannot close this DAK — only submit your action taken.";
    }
    return null;
  }, [readOnly, latestSubmission, canEdit]);

  if (readOnly && latestSubmission) {
    return (
      <Card className="border-primary/15">
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-base">Submitted Compliance</CardTitle>
          <CardDescription>
            Awaiting Collector review — you cannot edit after submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Action Taken Summary
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              {latestSubmission.actionTaken}
            </p>
          </div>
          {latestSubmission.attachmentFileName && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Action Taken Report (ATR)
              </p>
              {latestSubmission.attachmentDownloadUrl ? (
                <a
                  href={latestSubmission.attachmentDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  {latestSubmission.attachmentFileName}
                </a>
              ) : (
                <p className="mt-2 text-sm">{latestSubmission.attachmentFileName}</p>
              )}
            </div>
          )}
          {helperMessage && (
            <p className="text-sm text-muted-foreground">{helperMessage}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!canEdit) {
    return null;
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-primary/[0.03]">
        <CardTitle className="text-base">Complete Disposal Action</CardTitle>
        <CardDescription>
          Step-by-step compliance — everything required on one screen
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <form action={draftAction} className="space-y-6">
          <input type="hidden" name="dakId" value={dakId} />

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <Label htmlFor="actionTaken" className="text-sm font-semibold">
                Action Taken Summary <span className="text-destructive">*</span>
              </Label>
            </div>
            <textarea
              id="actionTaken"
              name="actionTaken"
              value={actionTaken}
              onChange={(event) => setActionTaken(event.target.value)}
              rows={5}
              placeholder="Describe the action taken on this DAK, decisions made, and outcome..."
              className={textareaClassName}
            />
            {actionTaken.trim().length > 0 && actionTaken.trim().length < 10 && (
              <p className="text-xs text-destructive">
                Please enter Action Taken Summary (minimum 10 characters).
              </p>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <Label htmlFor="atrFile" className="text-sm font-semibold">
                Upload Action Taken Report (ATR){" "}
                <span className="text-destructive">*</span>
              </Label>
            </div>
            <input
              id="atrFile"
              name="atrFile"
              type="file"
              accept={ALLOWED_ATTACHMENT_ACCEPT}
              onChange={(event) => {
                const file = event.target.files?.[0];
                setAtrSelected(!!file);
                setAtrFileName(file?.name ?? draft?.attachmentFileName ?? null);
              }}
              className="block w-full text-sm"
            />
            {atrFileName && (
              <p className="text-xs text-muted-foreground">
                {atrSelected ? "Selected: " : "Saved draft file: "}
                {atrFileName}
              </p>
            )}
            {!hasExistingAtr && (
              <p className="text-xs text-muted-foreground">
                PDF, Word, Excel, or image — office document formats only.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                3
              </span>
              <Label htmlFor="supportingFile" className="text-sm font-semibold">
                Supporting Documents{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
            </div>
            <input
              id="supportingFile"
              name="supportingFile"
              type="file"
              accept={ALLOWED_ATTACHMENT_ACCEPT}
              className="block w-full text-sm"
            />
          </section>

          <section className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                4
              </span>
              <p className="text-sm font-semibold">Submit Compliance</p>
            </div>

            {(draftState.message || submitState.message) && (
              <p
                className={cn(
                  "text-sm",
                  draftState.success || submitState.success
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-destructive"
                )}
                role="alert"
              >
                {submitState.message ?? draftState.message}
              </p>
            )}

            {!canSubmit && (
              <p className="text-xs text-muted-foreground">
                To submit: enter Action Taken Summary and upload the ATR document.
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={draftPending || submitPending}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 flex-1 gap-2 px-5"
                )}
              >
                {draftPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Draft
              </button>

              <button
                type="submit"
                formAction={submitAction}
                disabled={!canSubmit || submitPending || draftPending}
                className={cn(buttonVariants(), "h-11 flex-1 gap-2 px-5")}
              >
                {submitPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileUp className="size-4" />
                )}
                Submit Compliance
              </button>
            </div>
          </section>
        </form>
      </CardContent>
    </Card>
  );
}
