import { createAdminClient } from "@/lib/supabase/admin";
import {
  isActiveStatus,
  isTerminalStatus,
  LEGACY_COMPLETED_DB_STATUSES,
  normalizeDakStatus,
} from "@/features/dak/lib/workflow";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { isDepartmentDashboardRole } from "@/lib/auth/permissions";
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

function isCompletedDbStatus(status: string): boolean {
  return (
    isTerminalStatus(status) ||
    COMPLETED_DB_STATUSES.includes(status)
  );
}

function isPendingDbStatus(status: string): boolean {
  return isActiveStatus(status) && !isCompletedDbStatus(status);
}

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

function countOverdue(
  entries: Array<{ due_date: string | null; status: string }>,
  today: string
) {
  return entries.filter(
    (entry) =>
      entry.due_date &&
      entry.due_date < today &&
      !isCompletedDbStatus(entry.status)
  ).length;
}

/** Role-aware dashboard statistics. */
export async function getDashboardStats(
  user: SessionUser
): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();

  let query = supabase
    .from("dak_entries")
    .select("status, priority, due_date, department_id");

  if (isDepartmentDashboardRole(user.role) && user.departmentId) {
    query = query.eq("department_id", user.departmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getDashboardStats]", error.message);
    return isDepartmentDashboardRole(user.role)
      ? {
          variant: "department",
          assigned: 0,
          pendingActions: 0,
          overdue: 0,
          completed: 0,
        }
      : {
          variant: "collector",
          total: 0,
          pending: 0,
          overdue: 0,
          completed: 0,
          highPriority: 0,
        };
  }

  const entries = data ?? [];
  const highPrioritySet = new Set<PriorityLevel>(["urgent", "immediate"]);

  if (isDepartmentDashboardRole(user.role)) {
    let assigned = 0;
    let pendingActions = 0;
    let completed = 0;

    for (const entry of entries) {
      const status = entry.status as string;

      if (["assigned", "in_progress", "pending", "under_process"].includes(status)) {
        assigned += 1;
      }

      if (["in_progress", "pending", "under_process", "assigned"].includes(status)) {
        pendingActions += 1;
      }

      if (isCompletedDbStatus(status)) {
        completed += 1;
      }
    }

    return {
      variant: "department",
      assigned,
      pendingActions,
      overdue: countOverdue(entries, today),
      completed,
    };
  }

  let pending = 0;
  let completed = 0;
  let highPriority = 0;

  for (const entry of entries) {
    const status = entry.status as string;
    const priority = entry.priority as PriorityLevel;

    if (isPendingDbStatus(status)) {
      pending += 1;
    }

    if (isCompletedDbStatus(status)) {
      completed += 1;
    }

    if (!isCompletedDbStatus(status) && highPrioritySet.has(priority)) {
      highPriority += 1;
    }
  }

  return {
    variant: "collector",
    total: entries.length,
    pending,
    overdue: countOverdue(entries, today),
    completed,
    highPriority,
  };
}
