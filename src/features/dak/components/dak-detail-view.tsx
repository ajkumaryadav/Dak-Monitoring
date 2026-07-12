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
import { DakComplianceProgress } from "@/features/dak/components/dak-compliance-progress";
import { DakComplianceWorkflowPanel } from "@/features/dak/components/dak-compliance-workflow-panel";
import { DakOpenTracker } from "@/features/dak/components/dak-open-tracker";
import { DakCollectorReturnNotice } from "@/features/dak/components/dak-collector-return-notice";
import { DakComplianceReworkHistory } from "@/features/dak/components/dak-compliance-rework-history";
import { DakReworkActionRequired } from "@/features/dak/components/dak-rework-action-required";
import {
  buildComplianceVersionHistory,
  extractCollectorReturnNotice,
  shouldShowReworkBanner,
} from "@/features/dak/lib/compliance-rework";
import { DakDetailTabs } from "@/features/remarks/components/dak-detail-tabs";
import type { RemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import type {
  ComplianceDraftRecord,
  DakAtrRecord,
  DakRemarkRecord,
} from "@/features/remarks/services/get-remarks";
import {
  calculatePendingDays,
  formatPendingDays,
} from "@/features/audit/lib/pending-days";
import { AssignDakForm } from "@/features/dak/components/assign-dak-form";
import { AttachmentCard } from "@/features/dak/components/attachment-card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { DakDepartmentActionsPanel } from "@/features/dak-requests/components/dak-department-actions-panel";
import { DakClarificationExchange } from "@/features/dak-requests/components/dak-clarification-exchange";
import { DakDepartmentRequestStatus } from "@/features/dak-requests/components/dak-department-request-status";
import { DakPendingRequestsPanel } from "@/features/dak-requests/components/dak-pending-requests-panel";
import type { DakRequestRecord } from "@/features/dak-requests/services/dak-requests";
import type { DepartmentOption } from "@/features/dak/services/get-departments";
import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import {
  formatProcessStatusLabel,
  getComplianceProgressSteps,
} from "@/features/dak/lib/compliance-workflow";
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
import type { AssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import type { DakDetail } from "@/features/dak/services/get-dak-by-id";
import { SlaStatusBadge } from "@/features/sla/lib/sla-display";
import { getEscalationLevelLabel } from "@/features/sla/lib/sla-constants";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import { cn } from "@/lib/utils";

interface DakDetailViewProps {
  dak: DakDetail;
  timeline: DakTimelineEvent[];
  attachments: DakAttachmentWithUrl[];
  assignOptions: AssignFormOptions;
  showAssignForm: boolean;
  isReassign?: boolean;
  showDepartmentActions?: boolean;
  showRequestReview?: boolean;
  showComplianceWorkflow?: boolean;
  dakRequests?: DakRequestRecord[];
  departments?: DepartmentOption[];
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
  complianceDraft?: ComplianceDraftRecord | null;
  remarkPermissions: RemarkPermissions;
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

export function DakDetailView({
  dak,
  timeline,
  attachments,
  assignOptions,
  showAssignForm,
  isReassign = false,
  showDepartmentActions = false,
  showRequestReview = false,
  showComplianceWorkflow = false,
  dakRequests = [],
  departments = [],
  remarks,
  atrRecords,
  complianceDraft = null,
  remarkPermissions,
}: DakDetailViewProps) {
  const pendingDays = calculatePendingDays({
    receivedDate: dak.received_date,
    createdAt: dak.created_at,
    status: dak.status,
    disposedDate: dak.disposed_date,
    closedDate: dak.closed_date,
  });

  const progressSteps = showComplianceWorkflow
    ? getComplianceProgressSteps(dak.status, {
        hasAtrFile: atrRecords.some((record) => !!record.attachmentFileName),
        hasDraft: !!complianceDraft?.attachmentFileName,
      })
    : [];

  const letterAttachments = attachments.slice(0, 3);
  const showReworkBanner = showComplianceWorkflow
    ? shouldShowReworkBanner(timeline, atrRecords, dak.status)
    : false;
  const collectorReturnNotice = showReworkBanner
    ? extractCollectorReturnNotice(timeline)
    : null;
  const complianceVersions = showComplianceWorkflow
    ? buildComplianceVersionHistory(atrRecords, timeline, dak.status)
    : [];
  const showReworkHistory =
    complianceVersions.length > 0 &&
    (complianceVersions.length > 1 ||
      complianceVersions.some((version) => version.status === "returned"));
  const departmentName = getDepartmentName(dak.departments);

  return (
    <div className="space-y-6">
      {showComplianceWorkflow && (
        <DakOpenTracker dakId={dak.id} status={dak.status} />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/dak"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-9 w-fit gap-1.5 px-4"
          )}
        >
          <ArrowLeft className="size-4" />
          Back to All DAK
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

      {collectorReturnNotice && (
        <DakCollectorReturnNotice notice={collectorReturnNotice} />
      )}

      {showReworkBanner && <DakReworkActionRequired />}

      {showComplianceWorkflow && (
        <DakClarificationExchange requests={dakRequests} />
      )}

      {showDepartmentActions && (
        <DakDepartmentRequestStatus requests={dakRequests} />
      )}

      {showComplianceWorkflow && (
        <DakComplianceProgress
          steps={progressSteps}
          currentStatusLabel={formatProcessStatusLabel(dak.status)}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background lg:col-span-3">
          <CardHeader className="border-b border-border/60">
            <CardTitle>
              {showComplianceWorkflow ? "Step 1 — Review DAK" : "DAK Summary"}
            </CardTitle>
            <CardDescription>
              {showComplianceWorkflow
                ? "Review correspondence details and reference letter before taking action"
                : "Subject, status, priority, and department allocation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Subject">
                <span className="font-medium">{dak.subject}</span>
              </DetailRow>
              {dak.applicant_reference && (
                <DetailRow label="Reference Number">
                  {dak.applicant_reference}
                </DetailRow>
              )}
              <DetailRow label="Current Status">
                <Badge
                  variant="outline"
                  className={cn("capitalize", getStatusStyle(dak.status))}
                >
                  {showComplianceWorkflow
                    ? formatProcessStatusLabel(dak.status)
                    : formatDakStatus(dak.status)}
                </Badge>
                {showComplianceWorkflow && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Read-only — updated automatically based on your actions
                  </p>
                )}
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
              <DetailRow label="Due Date">
                {formatDakDate(dak.due_date)}
              </DetailRow>
              <DetailRow label="Assigned By / Officer">
                {getOfficerName(dak.assigned_officer)}
              </DetailRow>
              <DetailRow label="Department">
                {getDepartmentName(dak.departments)}
              </DetailRow>
              <DetailRow label="Received Date">
                {formatDakDate(dak.received_date)}
              </DetailRow>
              <DetailRow label="SLA Due Date">
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
                    <Badge
                      variant="outline"
                      className="border-red-950/30 bg-red-950/10 text-red-950 dark:text-red-300"
                    >
                      {getEscalationLevelLabel(dak.escalation_level)}
                    </Badge>
                  )}
                </div>
              </DetailRow>
              <DetailRow label="Sender">{dak.sender}</DetailRow>
              {dak.applicant_mobile && (
                <DetailRow label="Applicant Mobile">{dak.applicant_mobile}</DetailRow>
              )}
            </dl>

            {showComplianceWorkflow && (
              <div className="mt-4 border-t border-border/60 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Letter Preview
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
                    No letter attachment uploaded for this DAK.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          {showAssignForm && (
            <AssignDakForm
              dakId={dak.id}
              options={assignOptions}
              isReassign={isReassign}
            />
          )}

          {showRequestReview && (
            <DakPendingRequestsPanel
              requests={dakRequests}
              currentDueDate={dak.due_date}
              currentDepartmentName={departmentName}
            />
          )}

          {showDepartmentActions && (
            <DakDepartmentActionsPanel
              dakId={dak.id}
              departments={departments}
              currentDepartmentId={dak.department_id}
            />
          )}
        </div>
      </div>

      {showComplianceWorkflow && (
        <DakComplianceWorkflowPanel
          dakId={dak.id}
          status={dak.status}
          draft={complianceDraft}
          submittedRecords={atrRecords}
        />
      )}

      {showReworkHistory && (
        <DakComplianceReworkHistory versions={complianceVersions} />
      )}

      {showComplianceWorkflow ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-primary/15">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base">Audit Timeline</CardTitle>
              <CardDescription>
                Complete read-only history of actions on this DAK
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <DakDetailTabs
                dakId={dak.id}
                timeline={timeline}
                remarks={remarks}
                atrRecords={atrRecords}
                attachments={attachments}
                permissions={remarkPermissions}
                complianceMode
                defaultTab="timeline"
              />
            </CardContent>
          </Card>
          <AttachmentCard attachments={attachments} />
        </div>
      ) : (
        <DakDetailTabs
          dakId={dak.id}
          timeline={timeline}
          remarks={remarks}
          atrRecords={atrRecords}
          attachments={attachments}
          permissions={remarkPermissions}
        />
      )}
    </div>
  );
}
