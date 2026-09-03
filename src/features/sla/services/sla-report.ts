import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { getDepartmentName, getOfficerName } from "@/features/dak/lib/dak-display";
import { getDefaultSlaDays, getEscalationLevelLabel } from "@/features/sla/lib/sla-constants";
import { getEffectiveSlaDate } from "@/features/sla/lib/sla-display";
import type {
  EscalationReportRow,
  SlaComplianceRow,
  SlaDakRow,
} from "@/features/sla/lib/sla-types";
import {
  checkOverdueDaks,
  getEscalatedDaks,
  getDueSoonDaks,
  getDueTodayDaks,
} from "@/features/sla/services/sla-escalation";
import { PENDING_DB_STATUSES } from "@/features/reports/services/dashboard-analytics";
import { isDepartmentDashboardRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/db/admin";
import type { SessionUser } from "@/types";
import type { PriorityLevel } from "@/types";

const JOIN_SELECT =
  "id, dak_number, subject, priority, status, sla_due_date, due_date, escalation_level, assigned_to, department_id, received_date, departments(name), assigned_officer:users!dak_entries_assigned_to_fkey(name)";

function mapBaseRow(row: Record<string, unknown>): SlaDakRow {
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

function getDepartmentScope(user: SessionUser): string | undefined {
  if (isDepartmentDashboardRole(user.role) && user.departmentId) {
    return user.departmentId;
  }
  return undefined;
}

function daysBetween(from: string, to: string): number {
  const start = new Date(`${from.slice(0, 10)}T00:00:00Z`).getTime();
  const end = new Date(`${to.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function toIsoDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

/** SLA compliance report — active DAK with compliance status. */
export async function fetchSlaComplianceReport(
  user: SessionUser,
  options: { dueTodayOnly?: boolean; dueSoonOnly?: boolean } = {}
): Promise<SlaComplianceRow[]> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();
  const departmentScope = getDepartmentScope(user);

  let query = supabase
    .from("dak_entries")
    .select(JOIN_SELECT)
    .in("status", PENDING_DB_STATUSES)
    .order("sla_due_date", { ascending: true, nullsFirst: false });

  if (departmentScope) {
    query = query.eq("department_id", departmentScope);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchSlaComplianceReport]", error.message);
    return [];
  }

  const tomorrow = addDays(today, 1);

  return (data ?? [])
    .map((row) => {
      const base = mapBaseRow(row as Record<string, unknown>);
      const slaDate = getEffectiveSlaDate({
        slaDueDate: base.sla_due_date,
        dueDate: base.due_date,
      });
      const isOverdue = !!slaDate && slaDate < today;
      const daysRemaining = slaDate ? daysBetween(today, slaDate) : null;

      return {
        ...base,
        department_name: getDepartmentName(
          (row as Record<string, unknown>).departments as
            | { name: string }
            | { name: string }[]
            | null
        ),
        officer_name: getOfficerName(
          (row as Record<string, unknown>).assigned_officer as
            | { name: string }
            | { name: string }[]
            | null
        ),
        sla_days_allowed: getDefaultSlaDays(base.priority),
        is_compliant: !isOverdue && (base.escalation_level ?? 0) === 0,
        days_remaining: daysRemaining,
      } satisfies SlaComplianceRow;
    })
    .filter((row) => {
      const slaDate = getEffectiveSlaDate({
        slaDueDate: row.sla_due_date,
        dueDate: row.due_date,
      });
      if (options.dueTodayOnly) return slaDate === today;
      if (options.dueSoonOnly) return slaDate === tomorrow;
      return true;
    });
}

/** Escalation report — DAK with escalation_level >= 1. */
export async function fetchEscalationReport(
  user: SessionUser
): Promise<EscalationReportRow[]> {
  const departmentScope = getDepartmentScope(user);
  const entries = await getEscalatedDaks(departmentScope);
  const supabase = createAdminClient();

  const enriched: EscalationReportRow[] = [];

  for (const entry of entries) {
    const { data } = await supabase
      .from("dak_entries")
      .select("departments(name), assigned_officer:users!dak_entries_assigned_to_fkey(name)")
      .eq("id", entry.id)
      .maybeSingle();

    enriched.push({
      ...entry,
      department_name: getDepartmentName(
        (data as Record<string, unknown> | null)?.departments as
          | { name: string }
          | { name: string }[]
          | null
      ),
      officer_name: getOfficerName(
        (data as Record<string, unknown> | null)?.assigned_officer as
          | { name: string }
          | { name: string }[]
          | null
      ),
      escalation_label: getEscalationLevelLabel(entry.escalation_level),
    });
  }

  return enriched;
}

/** Overdue report rows scoped by RBAC. */
export async function fetchSlaOverdueReport(
  user: SessionUser
): Promise<SlaComplianceRow[]> {
  const departmentScope = getDepartmentScope(user);
  const overdue = await checkOverdueDaks(departmentScope);
  const today = getDistrictDateString();

  return overdue.map((entry) => {
    const isoDate = toIsoDate(entry.sla_due_date);
    return {
      ...entry,
      department_name: "—",
      officer_name: "—",
      sla_days_allowed: getDefaultSlaDays(entry.priority),
      is_compliant: false,
      days_remaining: isoDate ? daysBetween(today, isoDate) : null,
    };
  });
}

export async function fetchSlaDashboardData(user: SessionUser) {
  const departmentScope = getDepartmentScope(user);

  const [overdueEntries, escalatedEntries, dueTodayEntries, dueSoonEntries] =
    await Promise.all([
      checkOverdueDaks(departmentScope),
      getEscalatedDaks(departmentScope),
      getDueTodayDaks(departmentScope),
      getDueSoonDaks(departmentScope),
    ]);

  return {
    overdueEntries,
    escalatedEntries,
    dueTodayEntries,
    dueSoonEntries,
  };
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
