import { notFound } from "next/navigation";

import { DakDetailView } from "@/features/dak/components/dak-detail-view";
import { getDakAttachments } from "@/features/dak/actions/upload-attachment";
import { getAssignmentUnits } from "@/features/dak/services/get-assignment-units";
import { getDepartmentOfficers } from "@/features/dak/services/get-department-officers";
import {
  getDakById,
  getDakTimeline,
} from "@/features/dak/services/get-dak-by-id";
import {
  canAssignStatus,
  canReassignStatus,
} from "@/features/dak/lib/workflow";
import { hasPermission, PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

interface DakDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DakDetailPage({ params }: DakDetailPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const { id } = await params;
  const dak = await getDakById(id);

  if (!dak) {
    notFound();
  }

  const [timeline, attachments, departmentOfficers, sections, user] =
    await Promise.all([
      getDakTimeline(id),
      getDakAttachments(id),
      getDepartmentOfficers(),
      getAssignmentUnits("section"),
      getSessionUser(),
    ]);

  const canInitialAssign =
    !!user &&
    hasPermission(user.role, PERMISSIONS.DAK_ASSIGN) &&
    canAssignStatus(dak.status);

  const canReassign =
    !!user &&
    user.role === "collector" &&
    hasPermission(user.role, PERMISSIONS.DAK_ASSIGN) &&
    canReassignStatus(dak.status);

  const showAssignForm = canInitialAssign || canReassign;

  const canUpdateStatus = user
    ? hasPermission(user.role, PERMISSIONS.DAK_UPDATE)
    : false;

  return (
    <DakDetailView
      dak={dak}
      timeline={timeline}
      attachments={attachments}
      departmentOfficers={departmentOfficers}
      sections={sections}
      showAssignForm={showAssignForm}
      isReassign={canReassign}
      canUpdateStatus={canUpdateStatus}
    />
  );
}
