import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  calculatePendingDays,
  formatPendingDays,
} from "@/features/audit/lib/pending-days";
import {
  DakDepartmentSubmissionCard,
  DakSupportingDocumentsCard,
} from "@/features/dak/components/dak-department-submission-card";
import { DakComplianceReworkHistory } from "@/features/dak/components/dak-compliance-rework-history";
import { DakCollectorReviewPanel } from "@/features/dak/components/dak-collector-review-panel";
import { buildComplianceVersionHistory } from "@/features/dak/lib/compliance-rework";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { DakPendingRequestsPanel } from "@/features/dak-requests/components/dak-pending-requests-panel";
import type { DakRequestRecord } from "@/features/dak-requests/services/dak-requests";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import {
  formatDakDate,
  formatDakStatus,
  formatPriorityLabel,
  getDepartmentName,
  getOfficerName,
  getStatusStyle,
  priorityStyles,
  getBadgeClassName,
} from "@/features/dak/lib/dak-display";
import type { DakDetail } from "@/features/dak/services/get-dak-by-id";
import type { DakAtrRecord } from "@/features/remarks/services/get-remarks";
import { DakTimelinePanel } from "@/features/timeline/components/dak-timeline-panel";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import { SlaStatusBadge } from "@/features/sla/lib/sla-display";
import { getEscalationLevelLabel } from "@/features/sla/lib/sla-constants";
import { cn } from "@/lib/utils";

interface DakCollectorReviewViewProps {
  dak: DakDetail;
  timeline: DakTimelineEvent[];
  attachments: DakAttachmentWithUrl[];
  atrRecords: DakAtrRecord[];
  dakRequests?: DakRequestRecord[];
  showRequestReview?: boolean;
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** Approval-focused layout for Collector / ADM when DAK awaits closure review. */
export function DakCollectorReviewView({
  dak,
  timeline,
  attachments,
  atrRecords,
  dakRequests = [],
  showRequestReview = false,
}: DakCollectorReviewViewProps) {
  const pendingDays = calculatePendingDays({
    receivedDate: dak.received_date,
    createdAt: dak.created_at,
    status: dak.status,
    disposedDate: dak.disposed_date,
    closedDate: dak.closed_date,
  });

  const latestSubmission = atrRecords[0] ?? null;
  const departmentName = getDepartmentName(dak.departments);
  const letterAttachments = attachments.slice(0, 5);
  const complianceVersions = buildComplianceVersionHistory(
    atrRecords,
    timeline,
    dak.status
  );
  const showReworkHistory = complianceVersions.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/dak/pending-approval"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-9 w-fit gap-1.5 px-4"
          )}
        >
          <ArrowLeft className="size-4" />
          Back to Pending Approval
        </Link>
        <Badge variant="secondary" className="w-fit capitalize">
          {formatPendingDays(pendingDays)}
        </Badge>
      </div>

      <DakPageHeader
        title={dak.dak_number}
        description={dak.subject}
        icon={FileText}
      />

      {showRequestReview && (
        <DakPendingRequestsPanel
          requests={dakRequests}
          currentDueDate={dak.due_date}
          currentDepartmentName={departmentName}
        />
      )}

      <Card className="border-primary/15">
        <CardHeader className="border-b border-border/60">
          <CardTitle>DAK Details</CardTitle>
          <CardDescription>
            What is this file? — correspondence summary and reference letter
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <dl>
            <DetailRow label="Subject">
              <span className="font-medium">{dak.subject}</span>
            </DetailRow>
            {dak.applicant_reference && (
              <DetailRow label="Reference Number">
                {dak.applicant_reference}
              </DetailRow>
            )}
            <DetailRow label="Status">
              <Badge
                variant="outline"
                className={cn("capitalize", getStatusStyle(dak.status))}
              >
                {formatDakStatus(dak.status)}
              </Badge>
            </DetailRow>
            <DetailRow label="Priority">
              <Badge
                variant="secondary"
                className={getBadgeClassName(
                  priorityStyles,
                  dak.priority,
                  "bg-muted text-muted-foreground"
                )}
              >
                {formatPriorityLabel(dak.priority)}
              </Badge>
            </DetailRow>
            <DetailRow label="Due Date">{formatDakDate(dak.due_date)}</DetailRow>
            <DetailRow label="Department">{departmentName}</DetailRow>
            <DetailRow label="Assigned Officer">
              {getOfficerName(dak.assigned_officer)}
            </DetailRow>
            <DetailRow label="Received Date">
              {formatDakDate(dak.received_date)}
            </DetailRow>
            <DetailRow label="SLA">
              <div className="flex flex-wrap items-center gap-2">
                {formatDakDate(dak.sla_due_date ?? dak.due_date)}
                <SlaStatusBadge
                  entry={{
                    slaDueDate: dak.sla_due_date,
                    dueDate: dak.due_date,
                    escalationLevel: dak.escalation_level,
                  }}
                />
                {dak.escalation_level >= 1 && (
                  <Badge variant="outline" className="border-red-950/30 bg-red-950/10 text-red-950">
                    {getEscalationLevelLabel(dak.escalation_level)}
                  </Badge>
                )}
              </div>
            </DetailRow>
            <DetailRow label="Sender">{dak.sender}</DetailRow>
          </dl>

          <div className="mt-4 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Original Letter / Reference Files
            </p>
            {letterAttachments.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {letterAttachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={attachment.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {attachment.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No letter attachment on record.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <DakDepartmentSubmissionCard
        submission={latestSubmission}
        departmentName={departmentName}
      />

      <DakSupportingDocumentsCard
        attachments={attachments}
        atrFileName={latestSubmission?.attachmentFileName}
      />

      {showReworkHistory && (
        <DakComplianceReworkHistory versions={complianceVersions} />
      )}

      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle className="text-base">Workflow Timeline</CardTitle>
          <CardDescription>
            Read-only audit trail — what has happened on this DAK
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <DakTimelinePanel events={timeline} compact />
        </CardContent>
      </Card>

      <DakCollectorReviewPanel dakId={dak.id} />
    </div>
  );
}
