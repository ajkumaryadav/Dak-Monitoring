import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DakComplianceProgress } from "@/features/dak/components/dak-compliance-progress";
import { DakComplianceWorkflowPanel } from "@/features/dak/components/dak-compliance-workflow-panel";
import { DakOpenTracker } from "@/features/dak/components/dak-open-tracker";
import { DakCollectorReturnNotice } from "@/features/dak/components/dak-collector-return-notice";
import { DakComplianceReworkHistory } from "@/features/dak/components/dak-compliance-rework-history";
import { DakReworkActionRequired } from "@/features/dak/components/dak-rework-action-required";
import { DakCollectorReviewPanel } from "@/features/dak/components/dak-collector-review-panel";
import {
  DakDepartmentSubmissionCard,
  DakSupportingDocumentsCard,
} from "@/features/dak/components/dak-department-submission-card";
import { DakDocumentsPanel } from "@/features/dak/components/dak-documents-panel";
import { DakWorkflowTimeline } from "@/features/dak/components/dak-workflow-timeline";
import {
  buildComplianceVersionHistory,
  extractCollectorReturnNotice,
  shouldShowReworkBanner,
} from "@/features/dak/lib/compliance-rework";
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
import { DakMoveToRecycleBinButton } from "@/features/dak/components/dak-move-to-recycle-bin-button";
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
  formatAssignmentType,
  formatDakDate,
  formatDakDateTime,
  formatDakStatus,
  formatPriorityLabel,
  getDepartmentName,
  getOfficerName,
  getSourceName,
  getStatusStyle,
  getUnitName,
  priorityStyles,
  getBadgeClassName,
} from "@/features/dak/lib/dak-display";
import type { AssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import type { DakDetail } from "@/features/dak/services/get-dak-by-id";
import { SlaStatusBadge } from "@/features/sla/lib/sla-display";
import { getEscalationLevelLabel } from "@/features/sla/lib/sla-constants";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import { cn } from "@/lib/utils";

export interface DakDetailCapabilities {
  showAssignForm: boolean;
  isReassign: boolean;
  showDepartmentActions: boolean;
  showRequestReview: boolean;
  showComplianceWorkflow: boolean;
  showApprovalPanel: boolean;
  canMoveToRecycleBin: boolean;
  isOperatorView?: boolean;
  backHref?: string;
  backLabel?: string;
}

interface DakDetailViewProps {
  dak: DakDetail;
  timeline: DakTimelineEvent[];
  attachments: DakAttachmentWithUrl[];
  assignOptions: AssignFormOptions;
  dakRequests?: DakRequestRecord[];
  departments?: DepartmentOption[];
  remarks: DakRemarkRecord[];
  atrRecords: DakAtrRecord[];
  complianceDraft?: ComplianceDraftRecord | null;
  remarkPermissions: RemarkPermissions;
  capabilities: DakDetailCapabilities;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-0.5 border-b border-border/40 py-1.5 last:border-0 sm:grid-cols-[120px_1fr] sm:gap-2">
      <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Unified DAK Details — compact layout for Collector / ADM / ACP / officers.
 * Summary + Actions share one row on md+; Journey replaces tabbed correspondence.
 */
export function DakDetailView({
  dak,
  timeline,
  attachments,
  assignOptions,
  dakRequests = [],
  departments = [],
  remarks,
  atrRecords,
  complianceDraft = null,
  remarkPermissions: _remarkPermissions,
  capabilities,
}: DakDetailViewProps) {
  const {
    showAssignForm,
    isReassign,
    showDepartmentActions,
    showRequestReview,
    showComplianceWorkflow,
    showApprovalPanel,
    canMoveToRecycleBin,
    isOperatorView = false,
    backHref = "/dashboard/dak",
    backLabel = "Back to All DAK",
  } = capabilities;

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
  const sectionName = getUnitName(dak.assignment_units);
  const officerName = getOfficerName(dak.assigned_officer);
  const originName = getSourceName(dak.dak_sources);
  const lastUpdated =
    timeline[0]?.createdAt ??
    dak.closed_date ??
    dak.disposed_date ??
    dak.created_at;

  const hasActions =
    showAssignForm ||
    showRequestReview ||
    showDepartmentActions ||
    showComplianceWorkflow ||
    showApprovalPanel ||
    canMoveToRecycleBin;

  const showActionsPanel = hasActions;

  const assignEvent = timeline.find((e) =>
    /assign/i.test(`${e.actionType} ${e.actionTitle}`)
  );

  return (
    <div className="mx-auto max-w-7xl space-y-3 sm:space-y-4">
      {showComplianceWorkflow && (
        <DakOpenTracker dakId={dak.id} status={dak.status} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={backHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 gap-1.5"
          )}
        >
          <ArrowLeft className="size-3.5" />
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {formatPendingDays(pendingDays)}
          </Badge>
          <Badge
            variant="outline"
            className={cn("capitalize", getStatusStyle(dak.status))}
          >
            {showComplianceWorkflow
              ? formatProcessStatusLabel(dak.status)
              : formatDakStatus(dak.status)}
          </Badge>
        </div>
      </div>

      {/* Compact header strip */}
      <div className="rounded-xl border bg-card px-3 py-2.5 shadow-sm sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <DakPageHeader
            title={dak.dak_number}
            description={dak.subject}
            icon={FileText}
          />
          <dl className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-[10px] text-muted-foreground uppercase">
                Priority
              </dt>
              <dd>
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
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-muted-foreground uppercase">
                Due
              </dt>
              <dd className="font-medium">{formatDakDate(dak.due_date)}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-muted-foreground uppercase">
                Holder
              </dt>
              <dd className="truncate font-medium">{officerName}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-muted-foreground uppercase">
                Updated
              </dt>
              <dd className="truncate font-medium">
                {formatDakDateTime(lastUpdated)}
              </dd>
            </div>
          </dl>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/50 pt-2 text-xs text-muted-foreground">
          <span>
            Origin: <span className="text-foreground">{originName}</span>
          </span>
          <span>
            Dept: <span className="text-foreground">{departmentName}</span>
          </span>
          <span>
            Section: <span className="text-foreground">{sectionName}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            SLA: {formatDakDate(dak.sla_due_date ?? dak.due_date)}
            <SlaStatusBadge
              entry={{
                slaDueDate: dak.sla_due_date,
                dueDate: dak.due_date,
                escalationLevel: dak.escalation_level,
              }}
            />
            {dak.escalation_level >= 1 ? (
              <Badge
                variant="outline"
                className="border-red-950/30 bg-red-950/10 text-red-950 dark:text-red-300"
              >
                {getEscalationLevelLabel(dak.escalation_level)}
              </Badge>
            ) : null}
          </span>
        </div>
      </div>

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

      {/* Main content — left (Summary → Assignment → Timeline) | right (Actions → Documents) */}
      <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
        <div className="flex flex-col gap-3 lg:col-span-8">
          <section className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
            <h2 className="text-sm font-bold">DAK Summary</h2>
            <dl className="mt-2 grid gap-x-6 sm:grid-cols-2">
              <DetailRow label="Subject">
                <span className="font-medium">{dak.subject}</span>
              </DetailRow>
              <DetailRow label="Sender">{dak.sender}</DetailRow>
              <DetailRow label="Description">
                <span className="line-clamp-3">
                  {dak.description?.trim() || "—"}
                </span>
              </DetailRow>
              <DetailRow label="Category">
                {formatAssignmentType(dak.assignment_type)}
              </DetailRow>
              <DetailRow label="Received">
                {formatDakDate(dak.received_date)}
              </DetailRow>
              <DetailRow label="Registered">
                {formatDakDate(dak.created_at)}
              </DetailRow>
              <DetailRow label="Files">{attachments.length}</DetailRow>
              <DetailRow label="Stage">{formatDakStatus(dak.status)}</DetailRow>
              {dak.applicant_reference ? (
                <DetailRow label="Reference">{dak.applicant_reference}</DetailRow>
              ) : null}
              {dak.applicant_mobile ? (
                <DetailRow label="Mobile">{dak.applicant_mobile}</DetailRow>
              ) : null}
            </dl>
          </section>

          <section className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
            <h2 className="text-sm font-bold">Assignment Information</h2>
            <dl className="mt-2 grid gap-x-6 sm:grid-cols-2">
              <DetailRow label="Department">{departmentName}</DetailRow>
              <DetailRow label="Officer">{officerName}</DetailRow>
              <DetailRow label="Section">{sectionName}</DetailRow>
              <DetailRow label="Type">
                {formatAssignmentType(dak.assignment_type)}
              </DetailRow>
              <DetailRow label="Assigned">
                {formatDakDate(assignEvent?.createdAt ?? null)}
              </DetailRow>
              <DetailRow label="Assigned By">
                {assignEvent?.performerName ?? "—"}
              </DetailRow>
            </dl>
          </section>

          {showReworkHistory && (
            <DakComplianceReworkHistory versions={complianceVersions} />
          )}

          <DakWorkflowTimeline
            timeline={timeline}
            remarks={remarks}
            atrRecords={atrRecords}
            description={
              isOperatorView
                ? "Registration and forwarding history for this DAK"
                : "Complete workflow history — registration through closure"
            }
          />
        </div>

        <aside className="flex flex-col gap-3 lg:col-span-4">
          {showActionsPanel ? (
            <section className="max-h-[min(28rem,50vh)] overflow-y-auto overscroll-contain rounded-xl border border-primary/15 bg-card p-3 shadow-sm sm:p-4">
              <h2 className="text-sm font-bold">Available Actions</h2>
              <p className="text-[11px] text-muted-foreground">
                Role &amp; status based
              </p>
              <div className="mt-3 space-y-3">
                {showAssignForm ? (
                  <AssignDakForm
                    dakId={dak.id}
                    options={assignOptions}
                    isReassign={isReassign}
                    embedded
                  />
                ) : null}
                {showRequestReview ? (
                  <DakPendingRequestsPanel
                    requests={dakRequests}
                    currentDueDate={dak.due_date}
                    currentDepartmentName={departmentName}
                  />
                ) : null}
                {showDepartmentActions ? (
                  <DakDepartmentActionsPanel
                    dakId={dak.id}
                    departments={departments}
                    currentDepartmentId={dak.department_id}
                  />
                ) : null}
                {showApprovalPanel ? (
                  <>
                    <DakDepartmentSubmissionCard
                      submission={atrRecords[0] ?? null}
                      departmentName={departmentName}
                    />
                    <DakSupportingDocumentsCard
                      attachments={attachments}
                      atrFileName={atrRecords[0]?.attachmentFileName}
                    />
                    <DakCollectorReviewPanel dakId={dak.id} />
                  </>
                ) : null}
                {showComplianceWorkflow ? (
                  <DakComplianceWorkflowPanel
                    dakId={dak.id}
                    status={dak.status}
                    draft={complianceDraft}
                    submittedRecords={atrRecords}
                  />
                ) : null}
                {canMoveToRecycleBin ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
                    <p className="mb-2 text-xs font-medium text-destructive">
                      Delete DAK
                    </p>
                    <DakMoveToRecycleBinButton
                      dakId={dak.id}
                      dakNumber={dak.dak_number}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <DakDocumentsPanel
            attachments={attachments}
            atrRecords={atrRecords}
          />
        </aside>
      </div>
    </div>
  );
}
