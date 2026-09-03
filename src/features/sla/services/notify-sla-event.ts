import {
  CreateNotificationInput,
  createNotifications,
} from "@/features/notifications/services/notifications";
import { createAdminClient } from "@/lib/db/admin";

function formatSlaDate(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

const DISTRICT_WIDE_ROLE_SLUGS = ["collector", "adm", "acp"];

async function getDistrictWideUserIds(): Promise<string[]> {
  const supabase = createAdminClient();

  const { data: roles } = await supabase
    .from("roles")
    .select("id")
    .in("slug", DISTRICT_WIDE_ROLE_SLUGS);

  const roleIds = (roles ?? []).map((r: { id: string }) => r.id);
  if (!roleIds.length) return [];

  const { data: users } = await supabase
    .from("users")
    .select("id")
    .in("role_id", roleIds)
    .eq("is_active", true);

  return (users ?? []).map((u: { id: string }) => u.id);
}

async function getDepartmentUserIds(
  departmentId: string | null
): Promise<string[]> {
  if (!departmentId) return [];

  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from("users")
    .select("id")
    .eq("department_id", departmentId)
    .eq("is_active", true);

  return (users ?? []).map((u: { id: string }) => u.id);
}

function uniqueUserIds(ids: (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter(Boolean))] as string[];
}

async function hasRecentNotification(
  userId: string,
  dakId: string,
  type: string,
  withinHours = 24
): Promise<boolean> {
  const supabase = createAdminClient();
  const since = new Date(
    Date.now() - withinHours * 3600 * 1000
  ).toISOString();

  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("dak_id", dakId)
    .eq("type", type)
    .gte("created_at", since)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

async function sendNotifications(
  inputs: CreateNotificationInput[]
): Promise<void> {
  if (!inputs.length) return;
  try {
    await createNotifications(inputs);
  } catch (err) {
    console.error("[notify-sla-event] Failed to send SLA notifications:", err);
  }
}

interface NotifyDueTomorrowParams {
  dakId: string;
  dakNumber: string;
  subject: string;
  slaDueDate: string | Date | null;
  assignedToUserId: string | null;
  departmentId: string | null;
}

/** Notify assignee and department when SLA is due tomorrow. */
export async function notifySlaDueTomorrow(
  params: NotifyDueTomorrowParams
): Promise<void> {
  const deptIds = await getDepartmentUserIds(params.departmentId);
  const recipientIds = uniqueUserIds([
    params.assignedToUserId,
    ...deptIds,
  ]);

  const inputs: CreateNotificationInput[] = [];

  for (const userId of recipientIds) {
    const alreadySent = await hasRecentNotification(
      userId,
      params.dakId,
      "sla_due_tomorrow",
      24
    );
    if (alreadySent) continue;

    const formattedDate = formatSlaDate(params.slaDueDate);

    inputs.push({
      userId,
      type: "sla_due_tomorrow",
      title: "SLA Due Tomorrow",
      body: `${params.dakNumber} — ${params.subject} is due tomorrow (${formattedDate}).`,
      dakId: params.dakId,
      metadata: { sla_due_date: params.slaDueDate },
    });
  }

  await sendNotifications(inputs);
}

interface NotifySlaExpiredParams {
  dakId: string;
  dakNumber: string;
  subject: string;
  slaDueDate: string | Date | null;
  assignedToUserId: string | null;
  departmentId: string | null;
}

/** Notify when SLA has expired (overdue). */
export async function notifySlaExpired(
  params: NotifySlaExpiredParams
): Promise<void> {
  const districtIds = await getDistrictWideUserIds();
  const deptIds = await getDepartmentUserIds(params.departmentId);
  const recipientIds = uniqueUserIds([
    params.assignedToUserId,
    ...deptIds,
    ...districtIds,
  ]);

  const inputs: CreateNotificationInput[] = [];

  for (const userId of recipientIds) {
    const alreadySent = await hasRecentNotification(
      userId,
      params.dakId,
      "dak_overdue",
      24
    );
    if (alreadySent) continue;

    const formattedDate = formatSlaDate(params.slaDueDate);

    inputs.push({
      userId,
      type: "dak_overdue",
      title: "Overdue DAK Alert",
      body: `${params.dakNumber} is past SLA due date (${formattedDate}). ${params.subject}`,
      dakId: params.dakId,
      metadata: { sla_due_date: params.slaDueDate },
    });
  }

  await sendNotifications(inputs);
}

interface NotifyEscalatedParams {
  dakId: string;
  dakNumber: string;
  subject: string;
  escalationLevel: number;
  assignedToUserId: string | null;
  departmentId: string | null;
}

/** Notify when a DAK is escalated to higher authorities. */
export async function notifySlaEscalated(
  params: NotifyEscalatedParams
): Promise<void> {
  const districtIds = await getDistrictWideUserIds();
  const deptIds = await getDepartmentUserIds(params.departmentId);
  const recipientIds = uniqueUserIds([
    params.assignedToUserId,
    ...deptIds,
    ...districtIds,
  ]);

  const inputs: CreateNotificationInput[] = [];
  const levelText =
    params.escalationLevel === 1
      ? "ADM (Level 1)"
      : "District Collector (Level 2)";

  for (const userId of recipientIds) {
    inputs.push({
      userId,
      type: "dak_escalated",
      title: `DAK Escalated to ${levelText}`,
      body: `${params.dakNumber} has been automatically escalated to ${levelText} due to SLA breach. ${params.subject}`,
      dakId: params.dakId,
      metadata: { escalation_level: params.escalationLevel },
    });
  }

  await sendNotifications(inputs);
}
