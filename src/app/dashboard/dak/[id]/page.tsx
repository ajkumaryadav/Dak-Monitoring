import { notFound } from "next/navigation";

import { DakDetailView } from "@/features/dak/components/dak-detail-view";
import { getDakAttachments } from "@/features/dak/actions/upload-attachment";
import {
  getDakById,
  getDakTimeline,
} from "@/features/dak/services/get-dak-by-id";
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

  const timeline = await getDakTimeline(id);
  const attachments = await getDakAttachments(id);
  const user = await getSessionUser();
  const canUpdateStatus = user
    ? hasPermission(user.role, PERMISSIONS.DAK_UPDATE)
    : false;

  return (
    <DakDetailView
      dak={dak}
      timeline={timeline}
      attachments={attachments}
      canUpdateStatus={canUpdateStatus}
    />
  );
}
