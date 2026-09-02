import {
  createNotifications,
  hasRecentNotification,
  type CreateNotificationInput,
} from "@/features/notifications/services/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

const DISTRICT_WIDE_ROLES = ["collector", "acp", "adm"] as const;

async function getDistrictWideUserIds(): Promise<string[]> {
  const supabase = createAdminClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, roles(slug)")
    .eq("is_active", true);

  if (error) {
    console.error("[getDistrictWideUserIds]", error.message);
    return [];
  }

  return (users ?? [])
    .filter((user) => {
      const roleRecord = user.roles;
      const role = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;
      const slug = role?.slug as string | undefined;
      return (
        slug &&
        DISTRICT_WIDE_ROLES.includes(
          slug as (typeof DISTRICT_WIDE_ROLES)[number]
        )
      );
    })
    .map((user) => user.id as string);
}

async function getDepartmentUserIds(
  departmentId: string | null
): Promise<string[]> {
  if (!departmentId) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, roles(slug)")
    .eq("is_active", true)
    .eq("department_id", departmentId);

  if (error) {
    console.error("[getDepartmentUserIds]", error.message);
    return [];
  }

  return (data ?? [])
    .filter((user) => {
      const roleRecord = user.roles;
      const role = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;
      return role?.slug === "department_user";
    })
    .map((user) => user.id as string);
}

function uniqueUserIds(ids: (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter(Boolean) as string[])];
}

async function sendNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  if (!inputs.length) return;
  try {
    await createNotifications(inputs);
  } catch (error) {
    console.error("[notify-sla-event]", error);
  }
}

interface NotifyDueTomorrowParams {
  dakId: string;
  dakNumber: string;
  subject: string;
  slaDueDate: string | null;
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

    inputs.push({
      userId,
      type: "sla_due_tomorrow",
      title: "SLA Due Tomorrow",
      body: `${params.dakNumber} — ${params.subject} is due tomorrow (${params.slaDueDate?.slice(0, 10)}).`,
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
  slaDueDate: string | null;
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

    inputs.push({
      userId,
      type: "dak_overdue",
      title: "Overdue DAK Alert",
      body: `${params.dakNumber} is past SLA due date (${params.slaDueDate?.slice(0, 10)}). ${params.subject}`,
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
  escalationLabel: string;
  assignedToUserId: string | null;
  targetUserIds: string[];
}

/** Notify when a DAK is escalated to the next tier. */
export async function notifySlaEscalated(
  params: NotifyEscalatedParams
): Promise<void> {
  const districtIds = await getDistrictWideUserIds();
  const recipientIds = uniqueUserIds([
    params.assignedToUserId,
    ...params.targetUserIds,
    ...districtIds,
  ]);

  const inputs: CreateNotificationInput[] = [];

  for (const userId of recipientIds) {
    const alreadySent = await hasRecentNotification(
      userId,
      params.dakId,
      "dak_escalated",
      24
    );
    if (alreadySent) continue;

    inputs.push({
      userId,
      type: "dak_escalated",
      title: "DAK Escalated",
      body: `${params.dakNumber} escalated to ${params.escalationLabel}. ${params.subject}`,
      dakId: params.dakId,
      metadata: {
        escalation_level: params.escalationLevel,
        escalation_label: params.escalationLabel,
      },
    });
  }

  await sendNotifications(inputs);
}

/** Sync due-tomorrow alerts for all active DAK. */
export async function syncDueTomorrowNotifications(): Promise<void> {
  const { getDueSoonDaks } = await import(
    "@/features/sla/services/sla-escalation"
  );
  const { getEffectiveSlaDate } = await import(
    "@/features/sla/lib/sla-display"
  );

  const entries = await getDueSoonDaks();

  for (const entry of entries) {
    await notifySlaDueTomorrow({
      dakId: entry.id,
      dakNumber: entry.dak_number,
      subject: entry.subject,
      slaDueDate: getEffectiveSlaDate({
        slaDueDate: entry.sla_due_date,
        dueDate: entry.due_date,
      }),
      assignedToUserId: entry.assigned_to,
      departmentId: entry.department_id,
    });
  }
}
