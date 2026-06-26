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

/** Fetch pending DAK rows for reports with optional filters. */
export async function fetchPendingReport(
  user: SessionUser,
  filters: PendingReportFilters = {}
): Promise<PendingReportRow[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, sender, status, priority, due_date, received_date, created_at, department_id, departments(name)"
    )
    .in("status", PENDING_DB_STATUSES)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (isDepartmentDashboardRole(user.role) && user.departmentId) {
    query = query.eq("department_id", user.departmentId);
  } else if (filters.departmentId) {
    query = query.eq("department_id", filters.departmentId);
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
      due_date: row.due_date as string | null,
      received_date: row.received_date as string | null,
      created_at: row.created_at as string,
    }));
}
