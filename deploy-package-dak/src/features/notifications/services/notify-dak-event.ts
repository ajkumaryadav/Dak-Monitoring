import {
  createNotifications,
  hasRecentOverdueNotification,
  type CreateNotificationInput,
} from "@/features/notifications/services/notifications";
import { getStatusLabel } from "@/features/dak/lib/workflow";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DakStatus } from "@/types";

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

function uniqueUserIds(ids: (string | null | undefined)[]): string[] {
  return [...new Set(ids.filter(Boolean) as string[])];
}

async function sendNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  try {
    await createNotifications(inputs);
  } catch (error) {
    console.error("Notification failure:", error);
  }
}

interface NotifyCreatedParams {
  dakId: string;
  dakNumber: string;
  subject: string;
  actorUserId: string;
  actorName: string;
}

/** Notify Collector / ADM / ACP when a new DAK is registered by an operator. */
export async function notifyDakCreated(
  params: NotifyCreatedParams
): Promise<void> {
  // District oversight only — not the registering operator
  const recipientIds = await getDistrictWideUserIds();
  if (!recipientIds.length) return;

  await sendNotifications(
    recipientIds.map((userId) => ({
      userId,
      type: "dak_created",
      title: "New DAK Received",
      body: `${params.dakNumber} — ${params.subject} registered by ${params.actorName}. Awaiting assignment.`,
      dakId: params.dakId,
      metadata: {
        subject: params.subject,
        registered_by: params.actorName,
        registered_by_id: params.actorUserId,
      },
    }))
  );
}

interface NotifyAssignmentParams {
  dakId: string;
  dakNumber: string;
  isReassign: boolean;
  assignmentType: "department" | "section";
  targetLabel: string;
  assignedToUserId: string | null;
  /** Department UUID when assignmentType is department. */
  departmentId?: string | null;
  /** Section (assignment_unit) UUID when assignmentType is section. */
  sectionId?: string | null;
  actorUserId: string;
  actorName: string;
}

/** Active users belonging to a department or internal section. */
async function getUnitUserIds(params: {
  assignmentType: "department" | "section";
  departmentId?: string | null;
  sectionId?: string | null;
}): Promise<string[]> {
  const supabase = createAdminClient();

  if (params.assignmentType === "department" && params.departmentId) {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true)
      .eq("department_id", params.departmentId);
    if (error) {
      console.error("[getUnitUserIds:department]", error.message);
      return [];
    }
    return (data ?? []).map((u) => u.id as string);
  }

  if (params.assignmentType === "section" && params.sectionId) {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true)
      .eq("section_id", params.sectionId);
    if (error) {
      console.error("[getUnitUserIds:section]", error.message);
      return [];
    }
    return (data ?? []).map((u) => u.id as string);
  }

  return [];
}

/** Notify relevant users when a DAK is assigned or reassigned. */
export async function notifyDakAssignment(
  params: NotifyAssignmentParams
): Promise<void> {
  const type = params.isReassign ? "dak_reassigned" : "dak_assigned";
  const title = params.isReassign ? "DAK Reassigned" : "DAK Assigned";
  const body = `${params.dakNumber} ${params.isReassign ? "reassigned" : "assigned"} to ${params.targetLabel} by ${params.actorName}.`;

  const [districtIds, unitIds] = await Promise.all([
    getDistrictWideUserIds(),
    getUnitUserIds({
      assignmentType: params.assignmentType,
      departmentId: params.departmentId,
      sectionId: params.sectionId,
    }),
  ]);

  const recipientIds = uniqueUserIds([
    params.actorUserId,
    params.assignedToUserId,
    ...districtIds,
    ...unitIds,
  ]);

  if (!recipientIds.length) return;

  await sendNotifications(
    recipientIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      dakId: params.dakId,
      metadata: {
        assignment_type: params.assignmentType,
        target_label: params.targetLabel,
        is_reassign: params.isReassign,
        department_id: params.departmentId ?? null,
        section_id: params.sectionId ?? null,
      },
    }))
  );
}

interface NotifyStatusChangeParams {
  dakId: string;
  dakNumber: string;
  fromStatus: string;
  toStatus: DakStatus;
  assignedToUserId: string | null;
  actorUserId: string;
  actorName: string;
}

/** Notify when DAK workflow status changes. */
export async function notifyDakStatusChange(
  params: NotifyStatusChangeParams
): Promise<void> {
  const isCompleted = params.toStatus === "completed";
  const type = isCompleted ? "dak_completed" : "status_updated";
  const title = isCompleted ? "DAK Completed" : "Status Updated";
  const body = isCompleted
    ? `${params.dakNumber} marked completed by ${params.actorName}.`
    : `${params.dakNumber} updated from ${getStatusLabel(params.fromStatus)} to ${getStatusLabel(params.toStatus)} by ${params.actorName}.`;

  const districtIds = await getDistrictWideUserIds();
  const recipientIds = uniqueUserIds([
    params.actorUserId,
    params.assignedToUserId,
    ...districtIds,
  ]);

  await sendNotifications(
    recipientIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      dakId: params.dakId,
      metadata: {
        from_status: params.fromStatus,
        to_status: params.toStatus,
      },
    }))
  );
}

export interface OverdueDakRow {
  id: string;
  dak_number: string;
  subject: string;
  due_date: string | null;
  assigned_to: string | null;
  department_id: string | null;
}

export interface PriorityDakRow {
  id: string;
  dak_number: string;
  subject: string;
  priority: string;
  due_date: string | null;
}

const PENDING_STATUSES = [
  "received",
  "assigned",
  "in_progress",
  "pending",
  "under_process",
  "escalated",
];

/** Fetch active DAK past due date for overdue alerts. */
export async function getOverdueDakEntries(
  departmentId?: string | null
): Promise<OverdueDakRow[]> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();

  let query = supabase
    .from("dak_entries")
    .select("id, dak_number, subject, due_date, assigned_to, department_id")
    .in("status", PENDING_STATUSES)
    .not("due_date", "is", null)
    .lt("due_date", today);

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query.order("due_date", { ascending: true });

  if (error) {
    console.error("[getOverdueDakEntries]", error.message);
    return [];
  }

  return (data ?? []) as OverdueDakRow[];
}

/** Fetch active high-priority DAK (important + urgent). */
export async function getHighPriorityDakEntries(
  departmentId?: string | null
): Promise<PriorityDakRow[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("dak_entries")
    .select("id, dak_number, subject, priority, due_date")
    .in("priority", ["important", "urgent"])
    .in("status", PENDING_STATUSES);

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("[getHighPriorityDakEntries]", error.message);
    return [];
  }

  return (data ?? []) as PriorityDakRow[];
}

/** Fetch active immediate-priority DAK. */
export async function getImmediateDakEntries(
  departmentId?: string | null
): Promise<PriorityDakRow[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("dak_entries")
    .select("id, dak_number, subject, priority, due_date")
    .eq("priority", "immediate")
    .in("status", PENDING_STATUSES);

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("[getImmediateDakEntries]", error.message);
    return [];
  }

  return (data ?? []) as PriorityDakRow[];
}

/** Create overdue notifications (deduped per user/dak per 24h). Called on dashboard load. */
export async function syncOverdueNotifications(): Promise<void> {
  const overdueEntries = await getOverdueDakEntries();
  if (!overdueEntries.length) return;

  const districtIds = await getDistrictWideUserIds();

  for (const entry of overdueEntries) {
    const recipientIds = uniqueUserIds([entry.assigned_to, ...districtIds]);

    for (const userId of recipientIds) {
      const alreadySent = await hasRecentOverdueNotification(userId, entry.id);
      if (alreadySent) continue;

      await sendNotifications([
        {
          userId,
          type: "dak_overdue",
          title: "Overdue DAK Alert",
          body: `${entry.dak_number} is past due (${entry.due_date?.slice(0, 10)}). ${entry.subject}`,
          dakId: entry.id,
          metadata: { due_date: entry.due_date },
        },
      ]);
    }
  }
}
