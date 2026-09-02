import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import {
  ESCALATION_NOTIFY_ROLES,
  getEscalationLevelLabel,
  MAX_ESCALATION_LEVEL,
} from "@/features/sla/lib/sla-constants";
import { getEffectiveSlaDate } from "@/features/sla/lib/sla-display";
import type { SlaDakRow } from "@/features/sla/lib/sla-types";
import { notifySlaEscalated, notifySlaExpired } from "@/features/sla/services/notify-sla-event";
import { PENDING_DB_STATUSES } from "@/features/reports/services/dashboard-analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PriorityLevel } from "@/types";

const SLA_SELECT =
  "id, dak_number, subject, priority, status, sla_due_date, due_date, escalation_level, assigned_to, department_id, received_date";

function mapSlaDakRow(row: Record<string, unknown>): SlaDakRow {
  return {
    id: row.id as string,
    dak_number: row.dak_number as string,
    subject: row.subject as string,
    priority: row.priority as PriorityLevel,
    status: row.status as string,
    sla_due_date: (row.sla_due_date as string | null) ?? null,
    due_date: (row.due_date as string | null) ?? null,
    escalation_level: (row.escalation_level as number) ?? 0,
    assigned_to: (row.assigned_to as string | null) ?? null,
    department_id: (row.department_id as string | null) ?? null,
    received_date: (row.received_date as string | null) ?? null,
  };
}

function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isPastSlaDate(entry: SlaDakRow, today: string): boolean {
  const slaDate = getEffectiveSlaDate({
    slaDueDate: entry.sla_due_date,
    dueDate: entry.due_date,
  });
  return !!slaDate && slaDate < today;
}

function baseActiveQuery(
  supabase: ReturnType<typeof createAdminClient>,
  departmentId?: string | null
) {
  let query = supabase
    .from("dak_entries")
    .select(SLA_SELECT)
    .in("status", PENDING_DB_STATUSES);

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  return query;
}

/** Active DAK past SLA due date. */
export async function checkOverdueDaks(
  departmentId?: string | null
): Promise<SlaDakRow[]> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();

  const { data, error } = await baseActiveQuery(supabase, departmentId).order(
    "sla_due_date",
    { ascending: true, nullsFirst: false }
  );

  if (error) {
    console.error("[checkOverdueDaks]", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => mapSlaDakRow(row as Record<string, unknown>))
    .filter((entry) => isPastSlaDate(entry, today));
}

/** Active DAK with SLA due today. */
export async function getDueTodayDaks(
  departmentId?: string | null
): Promise<SlaDakRow[]> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();

  const { data, error } = await baseActiveQuery(supabase, departmentId);

  if (error) {
    console.error("[getDueTodayDaks]", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => mapSlaDakRow(row as Record<string, unknown>))
    .filter((entry) => {
      const slaDate = getEffectiveSlaDate({
        slaDueDate: entry.sla_due_date,
        dueDate: entry.due_date,
      });
      return slaDate === today;
    });
}

/** Active DAK due tomorrow (due soon). */
export async function getDueSoonDaks(
  departmentId?: string | null
): Promise<SlaDakRow[]> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();
  const tomorrow = addDaysToDateString(today, 1);

  const { data, error } = await baseActiveQuery(supabase, departmentId);

  if (error) {
    console.error("[getDueSoonDaks]", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => mapSlaDakRow(row as Record<string, unknown>))
    .filter((entry) => {
      const slaDate = getEffectiveSlaDate({
        slaDueDate: entry.sla_due_date,
        dueDate: entry.due_date,
      });
      return slaDate === tomorrow;
    });
}

/** Active DAK with escalation_level >= 1. */
export async function getEscalatedDaks(
  departmentId?: string | null
): Promise<SlaDakRow[]> {
  const supabase = createAdminClient();

  let query = baseActiveQuery(supabase, departmentId)
    .gte("escalation_level", 1)
    .order("escalation_level", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("[getEscalatedDaks]", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapSlaDakRow(row as Record<string, unknown>)
  );
}

async function getUsersForEscalationLevel(
  level: number,
  departmentId: string | null
): Promise<string[]> {
  const roles = ESCALATION_NOTIFY_ROLES[level];
  if (!roles?.length) return [];

  const supabase = createAdminClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, department_id, roles(slug)")
    .eq("is_active", true);

  if (error) {
    console.error("[getUsersForEscalationLevel]", error.message);
    return [];
  }

  return (users ?? [])
    .filter((user) => {
      const roleRecord = user.roles;
      const role = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;
      const slug = role?.slug as string | undefined;
      if (!slug || !roles.includes(slug)) return false;

      if (level === 1 && departmentId) {
        return user.department_id === departmentId;
      }

      return true;
    })
    .map((user) => user.id as string);
}

export interface EscalateDakResult {
  success: boolean;
  message?: string;
  newLevel?: number;
}

/** Escalate a single overdue DAK to the next tier. */
export async function escalateDak(
  dakId: string,
  actorUserId?: string | null
): Promise<EscalateDakResult> {
  const supabase = createAdminClient();

  const { data: dak, error } = await supabase
    .from("dak_entries")
    .select(SLA_SELECT)
    .eq("id", dakId)
    .maybeSingle();

  if (error || !dak) {
    return { success: false, message: "DAK entry not found." };
  }

  const entry = mapSlaDakRow(dak as Record<string, unknown>);
  const today = getDistrictDateString();

  if (!isPastSlaDate(entry, today)) {
    return { success: false, message: "DAK is not past SLA due date." };
  }

  if (entry.escalation_level >= MAX_ESCALATION_LEVEL) {
    return { success: false, message: "DAK is already at maximum escalation." };
  }

  const newLevel = entry.escalation_level + 1;
  const performerId = actorUserId ?? entry.assigned_to;

  const { error: updateError } = await supabase
    .from("dak_entries")
    .update({ escalation_level: newLevel })
    .eq("id", dakId);

  if (updateError) {
    return {
      success: false,
      message: updateError.message ?? "Failed to update escalation level.",
    };
  }

  if (performerId) {
    await logWorkflowAction({
      dakId,
      userId: performerId,
      eventType: "status_changed",
      timelineActionType: "sla_expired",
      action: "SLA Expired",
      remarks: `SLA due date ${getEffectiveSlaDate({ slaDueDate: entry.sla_due_date, dueDate: entry.due_date })} has passed.`,
      metadata: {
        sla_due_date: entry.sla_due_date,
        escalation_level: entry.escalation_level,
      },
    });

    await logWorkflowAction({
      dakId,
      userId: performerId,
      eventType: "status_changed",
      timelineActionType: "escalated",
      action: `Escalated to ${getEscalationLevelLabel(newLevel)}`,
      remarks: `Escalation level increased from ${entry.escalation_level} to ${newLevel}.`,
      metadata: {
        from_level: entry.escalation_level,
        to_level: newLevel,
        escalation_label: getEscalationLevelLabel(newLevel),
      },
    });
  }

  const recipientIds = await getUsersForEscalationLevel(
    newLevel,
    entry.department_id
  );

  await notifySlaExpired({
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

  await notifySlaEscalated({
    dakId: entry.id,
    dakNumber: entry.dak_number,
    subject: entry.subject,
    escalationLevel: newLevel,
    escalationLabel: getEscalationLevelLabel(newLevel),
    assignedToUserId: entry.assigned_to,
    targetUserIds: recipientIds,
  });

  return { success: true, newLevel };
}

/** Escalate all eligible overdue DAK entries — once per 24h per DAK. */
export async function escalateOverdueDaks(): Promise<number> {
  const overdue = await checkOverdueDaks();
  let escalated = 0;

  for (const entry of overdue) {
    if (entry.escalation_level >= MAX_ESCALATION_LEVEL) continue;

    const canEscalate = await canEscalateDakToday(entry.id);
    if (!canEscalate) continue;

    const result = await escalateDak(entry.id, entry.assigned_to);
    if (result.success) escalated += 1;
  }

  return escalated;
}

async function canEscalateDakToday(dakId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("dak_timeline")
    .select("id")
    .eq("dak_id", dakId)
    .eq("action_type", "escalated")
    .gte("created_at", since)
    .limit(1);

  if (error) {
    console.error("[canEscalateDakToday]", error.message);
    return false;
  }

  return !data?.length;
}
