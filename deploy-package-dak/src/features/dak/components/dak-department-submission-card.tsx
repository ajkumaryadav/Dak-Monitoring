import { Download, ExternalLink, FileText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatFileSize } from "@/features/dak/lib/attachment-validation";
import {
  formatDakDateTime,
} from "@/features/dak/lib/dak-display";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import type { DakAtrRecord } from "@/features/remarks/services/get-remarks";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DakDepartmentSubmissionCardProps {
  submission: DakAtrRecord | null;
  departmentName: string;
}

function DocumentActions({
  fileName,
  downloadUrl,
}: {
  fileName: string;
  downloadUrl: string | null;
}) {
  if (!downloadUrl) {
    return <span className="text-sm text-muted-foreground">{fileName}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5")}
      >
        <ExternalLink className="size-3.5" />
        Preview
      </a>
      <a
        href={downloadUrl}
        download={fileName}
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "h-8 gap-1.5")}
      >
        <Download className="size-3.5" />
        Download
      </a>
    </div>
  );
}

/** Read-only summary of department compliance submission for Collector review. */
export function DakDepartmentSubmissionCard({
  submission,
  departmentName,
}: DakDepartmentSubmissionCardProps) {
  return (
    <Card className="border-primary/15">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Compliance Submitted by Department</CardTitle>
        <CardDescription>
          Action taken, ATR, and submission details — read-only
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-5">
        {!submission ? (
          <p className="text-sm text-muted-foreground">
            No compliance submission is recorded for this DAK yet.
          </p>
        ) : (
          <>
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Action Taken Summary
              </p>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {submission.actionTaken}
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Action Taken Report (ATR)
              </p>
              <div className="rounded-lg border border-border/60 bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {submission.attachmentFileName ?? "ATR document"}
                    </p>
                    {submission.attachmentFileName && (
                      <DocumentActions
                        fileName={submission.attachmentFileName}
                        downloadUrl={submission.attachmentDownloadUrl}
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>

            <dl className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Submission Date
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {formatDakDateTime(submission.submittedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Submitted By
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {submission.submitterName ?? "Department Officer"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Department
                </dt>
                <dd className="mt-1 text-sm font-medium">{departmentName}</dd>
              </div>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface DakSupportingDocumentsCardProps {
  attachments: DakAttachmentWithUrl[];
  atrFileName?: string | null;
}

/** Supporting documents uploaded with compliance (excludes ATR duplicate if stored separately). */
export function DakSupportingDocumentsCard({
  attachments,
  atrFileName,
}: DakSupportingDocumentsCardProps) {
  const supporting = attachments.filter(
    (file) => !atrFileName || file.file_name !== atrFileName
  );

  return (
    <Card>
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Supporting Documents</CardTitle>
        <CardDescription>
          Evidence and reference files attached with this DAK
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {!supporting.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No supporting documents uploaded.
          </p>
        ) : (
          <ul className="space-y-3">
            {supporting.map((file) => (
              <li
                key={file.id}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/15 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-border/60">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </p>
                  </div>
                </div>
                <DocumentActions
                  fileName={file.file_name}
                  downloadUrl={file.downloadUrl}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
