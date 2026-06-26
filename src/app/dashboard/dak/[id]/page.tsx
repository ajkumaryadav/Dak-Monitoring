import { notFound } from "next/navigation";

import { DakDetailView } from "@/features/dak/components/dak-detail-view";
import { getDakAttachments } from "@/features/dak/actions/upload-attachment";
import { getDepartments } from "@/features/dak/services/get-departments";
import {
  getDakById,
  getDakTimeline,
} from "@/features/dak/services/get-dak-by-id";
import { canAssignStatus } from "@/features/dak/lib/workflow";
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

  const [timeline, attachments, departments, user] = await Promise.all([
    getDakTimeline(id),
    getDakAttachments(id),
    getDepartments(),
    getSessionUser(),
  ]);

  const canAssign =
    !!user &&
    hasPermission(user.role, PERMISSIONS.DAK_ASSIGN) &&
    canAssignStatus(dak.status);

  const canUpdateStatus = user
    ? hasPermission(user.role, PERMISSIONS.DAK_UPDATE)
    : false;

  return (
    <DakDetailView
      dak={dak}
      timeline={timeline}
      attachments={attachments}
      departments={departments}
      canAssign={canAssign}
      canUpdateStatus={canUpdateStatus}
    />
  );
}
