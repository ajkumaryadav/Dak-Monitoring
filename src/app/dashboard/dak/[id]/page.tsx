import { notFound } from "next/navigation";

import { DakDetailView } from "@/features/dak/components/dak-detail-view";
import { getDakAttachments } from "@/features/dak/actions/upload-attachment";
import { getAssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import {
  getDakById,
  getDakTimeline,
} from "@/features/dak/services/get-dak-by-id";
import {
  canAssignStatus,
  canReassignStatus,
} from "@/features/dak/lib/workflow";
import { getRemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import {
  getDakAtrRecords,
  getDakRemarks,
} from "@/features/remarks/services/get-remarks";
import { hasPermission, canReassignDakRole, PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

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

  const [timeline, attachments, assignOptions, remarks, atrRecords] =
    await Promise.all([
      getDakTimeline(id),
      getDakAttachments(id),
      getAssignFormOptions(),
      getDakRemarks(id, user),
      getDakAtrRecords(id),
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

  const canUpdateStatus = hasPermission(user.role, PERMISSIONS.DAK_UPDATE);

  return (
    <DakDetailView
      dak={dak}
      timeline={timeline}
      attachments={attachments}
      assignOptions={assignOptions}
      showAssignForm={showAssignForm}
      isReassign={canReassign}
      canUpdateStatus={canUpdateStatus}
      remarks={remarks}
      atrRecords={atrRecords}
      remarkPermissions={remarkPermissions}
    />
  );
}
