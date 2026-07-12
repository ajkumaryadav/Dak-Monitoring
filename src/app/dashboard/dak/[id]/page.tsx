import { notFound } from "next/navigation";

import { getDakAttachments } from "@/features/dak/actions/upload-attachment";
import { DakCollectorReviewView } from "@/features/dak/components/dak-collector-review-view";
import { DakDetailView } from "@/features/dak/components/dak-detail-view";
import { OperatorDakDetailView } from "@/features/dak/components/operator-dak-detail-view";
import { canShowComplianceWorkflow } from "@/features/dak/lib/compliance-workflow";
import {
  extractOperatorReturnNotice,
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

  const fullTimeline = await getDakTimeline(id, user);

  if (isOperatorDakViewer(user)) {
    const assignmentAt = findFirstAssignmentTimestamp(fullTimeline);
    const allAttachments = await getDakAttachments(id);
    const operatorTimeline = filterTimelineForOperator(fullTimeline);
    const operatorAttachments = filterAttachmentsForOperator(
      allAttachments,
      dak.created_by,
      assignmentAt
    );
    const returnNotice = extractOperatorReturnNotice(fullTimeline);

    return (
      <OperatorDakDetailView
        dak={dak}
        timeline={operatorTimeline}
        attachments={operatorAttachments}
        returnNotice={returnNotice}
      />
    );
  }

  const showComplianceWorkflow =
    canSubmitComplianceRole(user.role) && canShowComplianceWorkflow(dak.status);

  const [attachments, assignOptions, remarks, atrRecords, departments, dakRequests, complianceDraft] =
    await Promise.all([
      getDakAttachments(id),
      getAssignFormOptions(),
      getDakRemarks(id, user),
      getDakAtrRecords(id, user),
      getDepartments(),
      getDakRequestsForDak(id),
      showComplianceWorkflow ? getComplianceDraft(id, user.id) : Promise.resolve(null),
    ]);

  const remarkPermissions = getRemarkPermissions(user);

  const canInitialAssign =
    hasPermission(user.role, PERMISSIONS.DAK_ASSIGN) &&
    canAssignStatus(dak.status);

  const canReassign =
    canReassignDakRole(user.role) &&
    hasPermission(user.role, PERMISSIONS.DAK_ASSIGN) &&
    canReassignStatus(dak.status);

  const showAssignForm = canInitialAssign || canReassign;

  const showApprovalPanel =
    canApproveClosure(dak.status) &&
    (user.role === "collector" || user.role === "adm");

  const showDepartmentActions = canSubmitDepartmentRequests(user, dak.status);

  const showRequestReview =
    canReviewDepartmentRequests(user) &&
    dakRequests.some((request) => request.status === "pending");

  if (showApprovalPanel) {
    return (
      <DakCollectorReviewView
        dak={dak}
        timeline={fullTimeline}
        attachments={attachments}
        atrRecords={atrRecords}
        dakRequests={dakRequests}
        showRequestReview={showRequestReview}
      />
    );
  }

  return (
    <DakDetailView
      dak={dak}
      timeline={fullTimeline}
      attachments={attachments}
      assignOptions={assignOptions}
      showAssignForm={showAssignForm}
      isReassign={canReassign}
      showDepartmentActions={showDepartmentActions}
      showRequestReview={showRequestReview}
      showComplianceWorkflow={showComplianceWorkflow}
      dakRequests={dakRequests}
      departments={departments}
      remarks={remarks}
      atrRecords={atrRecords}
      complianceDraft={complianceDraft}
      remarkPermissions={remarkPermissions}
    />
  );
}
