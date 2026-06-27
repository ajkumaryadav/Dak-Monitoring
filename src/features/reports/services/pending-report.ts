import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeDakStatus } from "@/features/dak/lib/workflow";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { isDepartmentDashboardRole } from "@/lib/auth/permissions";
import {
  PENDING_DB_STATUSES,
  isCompletedDbStatus,
} from "@/features/reports/services/dashboard-analytics";
import type { SessionUser } from "@/types";
import type { DakStatus, PriorityLevel } from "@/types";

export interface PendingReportFilters {
  departmentId?: string;
  sourceId?: string;
  assignmentUnitId?: string;
  priority?: PriorityLevel | "";
  status?: DakStatus | "";
  dateFrom?: string;
  dateTo?: string;
  overdueOnly?: boolean;
}

export interface PendingReportRow {
  id: string;
  dak_number: string;
  subject: string;
  sender: string;
  status: DakStatus;
  priority: PriorityLevel;
  department_name: string;
  source_name: string;
  section_name: string;
  assignment_type: string | null;
  due_date: string | null;
  received_date: string | null;
  created_at: string;
}

const JOIN_SELECT =
  "id, dak_number, subject, sender, status, priority, due_date, received_date, created_at, department_id, source_id, assignment_type, assignment_unit_id, departments(name), dak_sources(source_name), assignment_units(unit_name)";

const BASE_SELECT =
  "id, dak_number, subject, sender, status, priority, due_date, received_date, created_at, department_id, source_id, assignment_type, assignment_unit_id";

function getDepartmentName(
  departments: { name: string } | { name: string }[] | null
): string {
  if (!departments) return "Unassigned";
  if (Array.isArray(departments)) return departments[0]?.name ?? "Unassigned";
  return departments.name ?? "Unassigned";
}

function getSourceName(
  sources: { source_name: string } | { source_name: string }[] | null
): string {
  if (!sources) return "—";
  if (Array.isArray(sources)) return sources[0]?.source_name ?? "—";
  return sources.source_name ?? "—";
}

function getUnitName(
  units: { unit_name: string } | { unit_name: string }[] | null
): string {
  if (!units) return "—";
  if (Array.isArray(units)) return units[0]?.unit_name ?? "—";
  return units.unit_name ?? "—";
}

function mapPendingRow(row: Record<string, unknown>): PendingReportRow {
  return {
    id: row.id as string,
    dak_number: row.dak_number as string,
    subject: row.subject as string,
    sender: row.sender as string,
    status: normalizeDakStatus(row.status as string),
    priority: row.priority as PriorityLevel,
    department_name: getDepartmentName(
      row.departments as { name: string } | { name: string }[] | null
    ),
    source_name: getSourceName(
      row.dak_sources as
        | { source_name: string }
        | { source_name: string }[]
        | null
    ),
    section_name: getUnitName(
      row.assignment_units as
        | { unit_name: string }
        | { unit_name: string }[]
        | null
    ),
    assignment_type: row.assignment_type as string | null,
    due_date: row.due_date as string | null,
    received_date: row.received_date as string | null,
    created_at: row.created_at as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPendingReportFilters(query: any, user: SessionUser, filters: PendingReportFilters) {
  let q = query;

  if (isDepartmentDashboardRole(user.role) && user.departmentId) {
    q = q.eq("department_id", user.departmentId);
  } else if (filters.departmentId) {
    q = q.eq("department_id", filters.departmentId);
  }

  if (filters.sourceId) q = q.eq("source_id", filters.sourceId);
  if (filters.assignmentUnitId) q = q.eq("assignment_unit_id", filters.assignmentUnitId);
  if (filters.priority) q = q.eq("priority", filters.priority);

  if (filters.status) {
    if (filters.status === "in_progress") {
      q = q.in("status", ["in_progress", "under_process"]);
    } else if (filters.status === "pending") {
      q = q.in("status", ["pending", "escalated"]);
    } else {
      q = q.eq("status", filters.status);
    }
  }

  if (filters.dateFrom) q = q.gte("received_date", filters.dateFrom);
  if (filters.dateTo) q = q.lte("received_date", filters.dateTo);
  if (filters.overdueOnly) q = q.lt("due_date", getDistrictDateString());

  return q;
}

async function enrichFallbackRows(
  supabase: ReturnType<typeof createAdminClient>,
  rows: Record<string, unknown>[]
): Promise<PendingReportRow[]> {
  const deptIds = [
    ...new Set(rows.map((row) => row.department_id as string | null).filter(Boolean)),
  ] as string[];
  const sourceIds = [
    ...new Set(rows.map((row) => row.source_id as string | null).filter(Boolean)),
  ] as string[];
  const unitIds = [
    ...new Set(
      rows.map((row) => row.assignment_unit_id as string | null).filter(Boolean)
    ),
  ] as string[];

  const departmentNames = new Map<string, string>();
  const sourceNames = new Map<string, string>();
  const unitNames = new Map<string, string>();

  if (deptIds.length) {
    const { data } = await supabase.from("departments").select("id, name").in("id", deptIds);
    for (const dept of data ?? []) {
      departmentNames.set(dept.id as string, dept.name as string);
    }
  }

  if (sourceIds.length) {
    const { data } = await supabase
      .from("dak_sources")
      .select("id, source_name")
      .in("id", sourceIds);
    for (const source of data ?? []) {
      sourceNames.set(source.id as string, source.source_name as string);
    }
  }

  if (unitIds.length) {
    const { data } = await supabase
      .from("assignment_units")
      .select("id, unit_name")
      .in("id", unitIds);
    for (const unit of data ?? []) {
      unitNames.set(unit.id as string, unit.unit_name as string);
    }
  }

  return rows
    .filter((row) => !isCompletedDbStatus(row.status as string))
    .map((row) =>
      mapPendingRow({
        ...row,
        departments: row.department_id
          ? { name: departmentNames.get(row.department_id as string) ?? "Department" }
          : null,
        dak_sources: row.source_id
          ? { source_name: sourceNames.get(row.source_id as string) ?? "—" }
          : null,
        assignment_units: row.assignment_unit_id
          ? { unit_name: unitNames.get(row.assignment_unit_id as string) ?? "—" }
          : null,
      })
    );
}

/** Fetch pending DAK rows for reports with optional filters. */
export async function fetchPendingReport(
  user: SessionUser,
  filters: PendingReportFilters = {}
): Promise<PendingReportRow[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("dak_entries")
    .select(JOIN_SELECT)
    .in("status", PENDING_DB_STATUSES)
    .order("due_date", { ascending: true, nullsFirst: false });

  query = applyPendingReportFilters(query, user, filters);

  const { data, error } = await query;

  if (!error && data) {
    return data
      .filter((row) => !isCompletedDbStatus(row.status as string))
      .map((row) => mapPendingRow(row as Record<string, unknown>));
  }

  if (error) {
    console.error("[fetchPendingReport] join query failed:", error.message);
  }

  let fallbackQuery = supabase
    .from("dak_entries")
    .select(BASE_SELECT)
    .in("status", PENDING_DB_STATUSES)
    .order("due_date", { ascending: true, nullsFirst: false });

  fallbackQuery = applyPendingReportFilters(fallbackQuery, user, filters);

  const fallback = await fallbackQuery;

  if (fallback.error) {
    console.error("[fetchPendingReport] fallback failed:", fallback.error.message);
    return [];
  }

  return enrichFallbackRows(supabase, (fallback.data ?? []) as Record<string, unknown>[]);
}

/** Fetch report rows filtered by DAK source name. */
export async function fetchSourceReport(
  user: SessionUser,
  sourceName: string,
  filters: Omit<PendingReportFilters, "sourceId"> = {}
): Promise<PendingReportRow[]> {
  const supabase = createAdminClient();

  const { data: source } = await supabase
    .from("dak_sources")
    .select("id")
    .eq("source_name", sourceName)
    .maybeSingle();

  if (!source?.id) return [];

  return fetchPendingReport(user, {
    ...filters,
    sourceId: source.id as string,
  });
}

/** Fetch report rows for internal section assignments. */
export async function fetchSectionReport(
  user: SessionUser,
  filters: PendingReportFilters = {}
): Promise<PendingReportRow[]> {
  const rows = await fetchPendingReport(user, filters);
  return rows.filter(
    (row) => row.assignment_type === "section" || row.section_name !== "—"
  );
}

/** Fetch report rows grouped by department assignment. */
export async function fetchDepartmentAssignmentReport(
  user: SessionUser,
  filters: PendingReportFilters = {}
): Promise<PendingReportRow[]> {
  const rows = await fetchPendingReport(user, filters);
  return rows.filter((row) => row.department_name !== "Unassigned");
}
