import { notFound } from "next/navigation";

import { getDakAttachments } from "@/features/dak/actions/upload-attachment";
import { CollectorAtrViewTracker } from "@/features/dak/components/collector-atr-view-tracker";
import {
  DakDetailView,
  type DakDetailCapabilities,
} from "@/features/dak/components/dak-detail-view";
import { canShowComplianceWorkflow } from "@/features/dak/lib/compliance-workflow";
import {
  filterAttachmentsForOperator,
  filterTimelineForOperator,
  findFirstAssignmentTimestamp,
  isOperatorDakViewer,
} from "@/features/dak/lib/operator-dak-access";
import {
  canAssignStatus,
  canApproveClosure,
  canReassignStatus,
} from "@/features/dak/lib/workflow";
import {
  canReviewDepartmentRequests,
  canSubmitDepartmentRequests,
} from "@/features/dak-requests/lib/request-permissions";
import { getDakRequestsForDak } from "@/features/dak-requests/services/dak-requests";
import { getRemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import {
  getComplianceDraft,
  getDakAtrRecords,
  getDakRemarks,
} from "@/features/remarks/services/get-remarks";
import { getDakTimeline } from "@/features/timeline/services/timeline";
import { getAssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import { getDepartments } from "@/features/dak/services/get-departments";
import { getDakById } from "@/features/dak/services/get-dak-by-id";
import {
  canReassignDakRole,
  canSubmitComplianceRole,
  hasPermission,
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";
import { canMoveDakToRecycleBin } from "@/features/system-admin/lib/permissions";

interface DakDetailPageProps {
  params: Promise<{ id: string }>;
}

function assertOfficerScope(
  user: Awaited<ReturnType<typeof requirePermission>>,
  dak: NonNullable<Awaited<ReturnType<typeof getDakById>>>
): boolean {
  if (user.role === "department_user" && user.departmentId) {
    return dak.department_id === user.departmentId;
  }

  if (user.role === "section_user" && user.sectionId) {
    return dak.assignment_unit_id === user.sectionId;
  }

  return true;
}

export default async function DakDetailPage({ params }: DakDetailPageProps) {
  const user = await requirePermission(PERMISSIONS.DAK_VIEW);

  const { id } = await params;
  const dak = await getDakById(id);

  if (!dak) {
    notFound();
  }

  if (isOperatorDakViewer(user) && dak.created_by !== user.id) {
    notFound();
  }

  if (canSubmitComplianceRole(user.role) && !assertOfficerScope(user, dak)) {
    notFound();
  }

  const isOperator = isOperatorDakViewer(user);
  const showComplianceWorkflow =
    !isOperator &&
    canSubmitComplianceRole(user.role) &&
    canShowComplianceWorkflow(dak.status);

  const fullTimeline = await getDakTimeline(id, user);

  const [
    allAttachments,
    assignOptions,
    remarks,
    atrRecords,
    departments,
    dakRequests,
    complianceDraft,
  ] = await Promise.all([
    getDakAttachments(id),
    getAssignFormOptions(),
    isOperator ? Promise.resolve([]) : getDakRemarks(id, user),
    isOperator ? Promise.resolve([]) : getDakAtrRecords(id, user),
    getDepartments(),
    getDakRequestsForDak(id),
    showComplianceWorkflow
      ? getComplianceDraft(id, user.id)
      : Promise.resolve(null),
  ]);

  let timeline = fullTimeline;
  let attachments = allAttachments;

  if (isOperator) {
    const assignmentAt = findFirstAssignmentTimestamp(fullTimeline);
    timeline = filterTimelineForOperator(fullTimeline);
    attachments = filterAttachmentsForOperator(
      allAttachments,
      dak.created_by,
      assignmentAt
    );
  }

  const remarkPermissions = getRemarkPermissions(user);

  const canInitialAssign =
    !isOperator &&
    hasPermission(user.role, PERMISSIONS.DAK_ASSIGN) &&
    canAssignStatus(dak.status);

  const canReassign =
    !isOperator &&
    canReassignDakRole(user.role) &&
    hasPermission(user.role, PERMISSIONS.DAK_ASSIGN) &&
    canReassignStatus(dak.status);

  const showApprovalPanel =
    !isOperator &&
    canApproveClosure(dak.status) &&
    (user.role === "collector" || user.role === "adm");

  const capabilities: DakDetailCapabilities = {
    showAssignForm: canInitialAssign || canReassign,
    isReassign: canReassign,
    showDepartmentActions:
      !isOperator && canSubmitDepartmentRequests(user, dak.status),
    showRequestReview:
      !isOperator &&
      canReviewDepartmentRequests(user) &&
      dakRequests.some((request) => request.status === "pending"),
    showComplianceWorkflow,
    showApprovalPanel,
    canMoveToRecycleBin: !isOperator && canMoveDakToRecycleBin(user.role),
    isOperatorView: isOperator,
    backHref: showApprovalPanel
      ? "/dashboard/dak/pending-approval"
      : "/dashboard/dak",
    backLabel: showApprovalPanel ? "Back to Pending Approval" : "Back to All DAK",
  };

  return (
    <>
      <CollectorAtrViewTracker dakId={dak.id} status={dak.status} />
      <DakDetailView
        dak={dak}
        timeline={timeline}
        attachments={attachments}
        assignOptions={assignOptions}
        dakRequests={dakRequests}
        departments={departments}
        remarks={remarks}
        atrRecords={atrRecords}
        complianceDraft={complianceDraft}
        remarkPermissions={remarkPermissions}
        capabilities={capabilities}
      />
    </>
  );
}
