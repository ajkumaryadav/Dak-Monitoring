import {
  formatAssignmentLabel,
  getDepartmentName,
  getOfficerName,
  getSourceName,
  getUnitName,
} from "@/features/dak/lib/dak-display";
import { normalizeDakStatus } from "@/features/dak/lib/workflow";
import { PENDING_DB_STATUSES } from "@/features/reports/services/dashboard-analytics";
import { isDepartmentDashboardRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/types";
import type { DakStatus, PriorityLevel } from "@/types";

export interface AtrReportRow {
  id: string;
  dak_number: string;
  subject: string;
  status: DakStatus;
  priority: PriorityLevel;
  department_name: string;
  officer_name: string;
  assignment_label: string;
  source_name: string;
  received_date: string | null;
  atr_count: number;
  latest_atr_at: string | null;
}

const DAK_SELECT =
  "id, dak_number, subject, status, priority, received_date, department_id, source_id, assignment_type, assignment_unit_id, assigned_to, departments(name), dak_sources(source_name), assignment_units(unit_name), assigned_officer:users!dak_entries_assigned_to_fkey(name)";

function mapAtrReportRow(
  row: Record<string, unknown>,
  atrCount: number,
  latestAtrAt: string | null
): AtrReportRow {
  const departmentName = getDepartmentName(
    row.departments as { name: string } | { name: string }[] | null
  );
  const sectionName = getUnitName(
    row.assignment_units as
      | { unit_name: string }
      | { unit_name: string }[]
      | null
  );
  const officerName = getOfficerName(
    row.assigned_officer as { name: string } | { name: string }[] | null
  );
  const assignmentType = row.assignment_type as string | null;
  const targetName =
    assignmentType === "section"
      ? sectionName !== "—"
        ? sectionName
        : "Unassigned"
      : departmentName !== "—"
        ? departmentName
        : "Unassigned";

  return {
    id: row.id as string,
    dak_number: row.dak_number as string,
    subject: row.subject as string,
    status: normalizeDakStatus(row.status as string),
    priority: row.priority as PriorityLevel,
    department_name: departmentName === "—" ? "Unassigned" : departmentName,
    officer_name: officerName === "Not assigned" ? "—" : officerName,
    assignment_label: formatAssignmentLabel(
      targetName,
      officerName === "Not assigned" ? null : officerName
    ),
    source_name: getSourceName(
      row.dak_sources as
        | { source_name: string }
        | { source_name: string }[]
        | null
    ),
    received_date: (row.received_date as string | null) ?? null,
    atr_count: atrCount,
    latest_atr_at: latestAtrAt,
  };
}

function applyScope(
  user: SessionUser,
  departmentId?: string
): string | undefined {
  if (isDepartmentDashboardRole(user.role) && user.departmentId) {
    return user.departmentId;
  }
  return departmentId;
}

async function getAtrCountsByDak(): Promise<
  Map<string, { count: number; latestAt: string | null }>
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dak_atr")
    .select("dak_id, submitted_at");

  if (error) {
    console.error("[getAtrCountsByDak]", error.message);
    return new Map();
  }

  const map = new Map<string, { count: number; latestAt: string | null }>();

  for (const row of data ?? []) {
    const dakId = row.dak_id as string;
    const submittedAt = row.submitted_at as string;
    const existing = map.get(dakId) ?? { count: 0, latestAt: null };
    existing.count += 1;
    if (!existing.latestAt || submittedAt > existing.latestAt) {
      existing.latestAt = submittedAt;
    }
    map.set(dakId, existing);
  }

  return map;
}

/** Active assigned DAK with no ATR submission. */
export async function fetchAtrPendingReport(
  user: SessionUser
): Promise<AtrReportRow[]> {
  const supabase = createAdminClient();
  const atrCounts = await getAtrCountsByDak();
  const departmentScope = applyScope(user);

  let query = supabase
    .from("dak_entries")
    .select(DAK_SELECT)
    .in("status", PENDING_DB_STATUSES)
    .not("assigned_to", "is", null)
    .order("received_date", { ascending: true });

  if (departmentScope) {
    query = query.eq("department_id", departmentScope);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchAtrPendingReport]", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => !atrCounts.has(row.id as string))
    .map((row) => mapAtrReportRow(row as Record<string, unknown>, 0, null));
}

/** DAK with at least one submitted ATR. */
export async function fetchAtrSubmittedReport(
  user: SessionUser
): Promise<AtrReportRow[]> {
  const supabase = createAdminClient();
  const atrCounts = await getAtrCountsByDak();
  const departmentScope = applyScope(user);

  const dakIdsWithAtr = [...atrCounts.keys()];
  if (!dakIdsWithAtr.length) return [];

  let query = supabase
    .from("dak_entries")
    .select(DAK_SELECT)
    .in("id", dakIdsWithAtr)
    .order("received_date", { ascending: false });

  if (departmentScope) {
    query = query.eq("department_id", departmentScope);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchAtrSubmittedReport]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const stats = atrCounts.get(row.id as string)!;
    return mapAtrReportRow(
      row as Record<string, unknown>,
      stats.count,
      stats.latestAt
    );
  });
}
