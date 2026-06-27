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

/** Fetch pending DAK rows for reports with optional filters. */
export async function fetchPendingReport(
  user: SessionUser,
  filters: PendingReportFilters = {}
): Promise<PendingReportRow[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, sender, status, priority, due_date, received_date, created_at, department_id, source_id, assignment_type, assignment_unit_id, departments(name), dak_sources(source_name), assignment_units(unit_name)"
    )
    .in("status", PENDING_DB_STATUSES)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (isDepartmentDashboardRole(user.role) && user.departmentId) {
    query = query.eq("department_id", user.departmentId);
  } else if (filters.departmentId) {
    query = query.eq("department_id", filters.departmentId);
  }

  if (filters.sourceId) {
    query = query.eq("source_id", filters.sourceId);
  }

  if (filters.assignmentUnitId) {
    query = query.eq("assignment_unit_id", filters.assignmentUnitId);
  }

  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte("received_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("received_date", filters.dateTo);
  }

  if (filters.overdueOnly) {
    query = query.lt("due_date", getDistrictDateString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchPendingReport]", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => !isCompletedDbStatus(row.status as string))
    .map((row) => ({
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
    }));
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

  if (!source?.id) {
    return [];
  }

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
  return rows.filter((row) => row.assignment_type === "section");
}

/** Fetch report rows grouped by department assignment. */
export async function fetchDepartmentAssignmentReport(
  user: SessionUser,
  filters: PendingReportFilters = {}
): Promise<PendingReportRow[]> {
  const rows = await fetchPendingReport(user, filters);
  return rows.filter(
    (row) => row.assignment_type === "department" || row.department_name !== "Unassigned"
  );
}
