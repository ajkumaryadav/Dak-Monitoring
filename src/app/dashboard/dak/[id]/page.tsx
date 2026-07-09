import { notFound } from "next/navigation";

import { getDakAttachments } from "@/features/dak/actions/upload-attachment";
import { DakDetailView } from "@/features/dak/components/dak-detail-view";
import { OperatorDakDetailView } from "@/features/dak/components/operator-dak-detail-view";
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
  getDakAtrRecords,
  getDakRemarks,
} from "@/features/remarks/services/get-remarks";
import { getDakTimeline } from "@/features/timeline/services/timeline";
import { getAssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import { getDepartments } from "@/features/dak/services/get-departments";
import { getDakById } from "@/features/dak/services/get-dak-by-id";
import {
  canReassignDakRole,
  canUpdateDakStatusRole,
  hasPermission,
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";

interface DakDetailPageProps {
  params: Promise<{ id: string }>;
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

  const [attachments, assignOptions, remarks, atrRecords, departments, dakRequests] =
    await Promise.all([
      getDakAttachments(id),
      getAssignFormOptions(),
      getDakRemarks(id, user),
      getDakAtrRecords(id, user),
      getDepartments(),
      getDakRequestsForDak(id),
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

  const canUpdateStatus = canUpdateDakStatusRole(user.role);

  const showApprovalPanel =
    canApproveClosure(dak.status) &&
    (user.role === "collector" || user.role === "adm");

  const showDepartmentActions = canSubmitDepartmentRequests(user, dak.status);

  const showRequestReview =
    canReviewDepartmentRequests(user) &&
    dakRequests.some((request) => request.status === "pending");

  return (
    <DakDetailView
      dak={dak}
      timeline={fullTimeline}
      attachments={attachments}
      assignOptions={assignOptions}
      showAssignForm={showAssignForm}
      isReassign={canReassign}
      canUpdateStatus={canUpdateStatus}
      showApprovalPanel={showApprovalPanel}
      showDepartmentActions={showDepartmentActions}
      showRequestReview={showRequestReview}
      dakRequests={dakRequests}
      departments={departments}
      remarks={remarks}
      atrRecords={atrRecords}
      remarkPermissions={remarkPermissions}
    />
  );
}
