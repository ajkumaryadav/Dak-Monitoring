import {
  createNotifications,
  type CreateNotificationInput,
} from "@/features/notifications/services/notifications";
import { getRemarkTypeLabel } from "@/features/remarks/lib/remark-types";
import { createAdminClient } from "@/lib/supabase/admin";

async function getDistrictNotifyIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data: roles } = await supabase
    .from("roles")
    .select("id, slug")
    .in("slug", ["collector", "acp", "adm"]);

  if (!roles?.length) return [];

  const roleIds = roles.map((r) => r.id as string);
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .eq("is_active", true)
    .in("role_id", roleIds);

  return (users ?? []).map((u) => u.id as string);
}

async function getAssignedOfficerId(dakId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("dak_entries")
    .select("assigned_to")
    .eq("id", dakId)
    .maybeSingle();

  return (data?.assigned_to as string | null) ?? null;
}

async function sendRemarkNotifications(
  inputs: CreateNotificationInput[]
): Promise<void> {
  try {
    await createNotifications(inputs);
  } catch (error) {
    console.error("[notifyRemarkEvent]", error);
  }
}

export async function notifyRemarkAdded(params: {
  dakId: string;
  dakNumber: string;
  remarkType: string;
  actorUserId: string;
  actorName: string;
}): Promise<void> {
  const districtIds = await getDistrictNotifyIds();
  const assignedTo = await getAssignedOfficerId(params.dakId);
  const label = getRemarkTypeLabel(
    params.remarkType as Parameters<typeof getRemarkTypeLabel>[0]
  );

  const recipientIds = [
    ...new Set([params.actorUserId, assignedTo, ...districtIds].filter(Boolean)),
  ] as string[];

  await sendRemarkNotifications(
    recipientIds.map((userId) => ({
      userId,
      type: "remark_added",
      title: "New Remark Added",
      body: `${label} on ${params.dakNumber} by ${params.actorName}.`,
      dakId: params.dakId,
      metadata: { remark_type: params.remarkType },
    }))
  );
}

export async function notifyAtrSubmitted(params: {
  dakId: string;
  dakNumber: string;
  actorUserId: string;
  actorName: string;
}): Promise<void> {
  const districtIds = await getDistrictNotifyIds();

  const recipientIds = [
    ...new Set([params.actorUserId, ...districtIds].filter(Boolean)),
  ] as string[];

  await sendRemarkNotifications(
    recipientIds.map((userId) => ({
      userId,
      type: "atr_submitted",
      title: "Action Taken Report Submitted",
      body: `ATR submitted for ${params.dakNumber} by ${params.actorName}.`,
      dakId: params.dakId,
      metadata: {},
    }))
  );
}
