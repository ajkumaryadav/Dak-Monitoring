import { createAdminClient } from "@/lib/supabase/admin";
import {
  LEGACY_COMPLETED_DB_STATUSES,
  normalizeDakStatus,
} from "@/features/dak/lib/workflow";
import { fetchDashboardStatsSummary } from "@/features/reports/services/dashboard-analytics";
import type { SessionUser } from "@/types";
import type { DakStatus, PriorityLevel } from "@/types";

export type DakListFilter = "all" | "pending" | "completed" | "assignments";

export interface DakListEntry {
  id: string;
  dak_number: string;
  subject: string;
  sender: string;
  priority: PriorityLevel;
  status: DakStatus;
  due_date: string | null;
  departments: { name: string } | { name: string }[] | null;
}

export interface CollectorDashboardStats {
  variant: "collector";
  total: number;
  pending: number;
  overdue: number;
  completed: number;
  highPriority: number;
}

export interface DepartmentDashboardStats {
  variant: "department";
  assigned: number;
  pendingActions: number;
  overdue: number;
  completed: number;
}

export type DashboardStats = CollectorDashboardStats | DepartmentDashboardStats;

const PENDING_DB_STATUSES = [
  "received",
  "assigned",
  "in_progress",
  "pending",
  "under_process",
  "escalated",
];

const COMPLETED_DB_STATUSES = [
  "completed",
  "closed",
  ...LEGACY_COMPLETED_DB_STATUSES,
];

function normalizeEntry(entry: DakListEntry & { status: string }): DakListEntry {
  return {
    ...entry,
    status: normalizeDakStatus(entry.status),
  };
}

/** Fetch DAK entries for list views with optional status filter. */
export async function getDakList(
  filter: DakListFilter = "all",
  departmentId?: string | null
): Promise<DakListEntry[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, sender, priority, status, due_date, departments(name)"
    )
    .order("created_at", { ascending: false });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  if (filter === "assignments") {
    query = query.eq("status", "received");
  } else if (filter === "pending") {
    query = query.in("status", PENDING_DB_STATUSES);
  } else if (filter === "completed") {
    query = query.in("status", COMPLETED_DB_STATUSES);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getDakList]", error.message);
    return [];
  }

  return (data ?? []).map((entry) =>
    normalizeEntry(entry as DakListEntry & { status: string })
  );
}

/** Role-aware dashboard statistics — delegates to reports analytics service. */
export async function getDashboardStats(
  user: SessionUser
): Promise<DashboardStats> {
  return fetchDashboardStatsSummary(user);
}
