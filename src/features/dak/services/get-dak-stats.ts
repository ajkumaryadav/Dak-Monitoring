import { createAdminClient } from "@/lib/supabase/admin";
import { getDepartmentName } from "@/features/dak/lib/dak-display";
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

function sanitizeSearchTerm(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function entryMatchesSearch(entry: DakListEntry, term: string): boolean {
  const normalized = term.toLowerCase();
  const tokens = normalized.split(" ").filter(Boolean);

  const haystack = [
    entry.dak_number,
    entry.subject,
    entry.sender,
    getDepartmentName(entry.departments),
  ]
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

/** Filter a DAK list by search term within the current list scope. */
export async function getFilteredDakList(
  filter: DakListFilter,
  searchQuery?: string,
  departmentId?: string | null
): Promise<DakListEntry[]> {
  const entries = await getDakList(filter, departmentId);
  const term = sanitizeSearchTerm(searchQuery ?? "");

  if (!term) {
    return entries;
  }

  return entries.filter((entry) => entryMatchesSearch(entry, term));
}

/** @deprecated Use getFilteredDakList("all", searchQuery, departmentId) */
export async function searchDakEntries(
  searchQuery: string,
  departmentId?: string | null
): Promise<DakListEntry[]> {
  return getFilteredDakList("all", searchQuery, departmentId);
}

async function fetchDakListRows(
  filter: DakListFilter,
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

  if (!error && data) {
    return data.map((entry) =>
      normalizeEntry(entry as DakListEntry & { status: string })
    );
  }

  if (error) {
    console.error("[getDakList] join query failed:", error.message);
  }

  let fallbackQuery = supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, sender, priority, status, due_date, department_id"
    )
    .order("created_at", { ascending: false });

  if (departmentId) {
    fallbackQuery = fallbackQuery.eq("department_id", departmentId);
  }

  if (filter === "assignments") {
    fallbackQuery = fallbackQuery.eq("status", "received");
  } else if (filter === "pending") {
    fallbackQuery = fallbackQuery.in("status", PENDING_DB_STATUSES);
  } else if (filter === "completed") {
    fallbackQuery = fallbackQuery.in("status", COMPLETED_DB_STATUSES);
  }

  const fallback = await fallbackQuery;

  if (fallback.error) {
    console.error("[getDakList] fallback failed:", fallback.error.message);
    return [];
  }

  const deptIds = [
    ...new Set(
      (fallback.data ?? [])
        .map((row) => row.department_id as string | null)
        .filter(Boolean)
    ),
  ] as string[];

  const departmentNames = new Map<string, string>();

  if (deptIds.length) {
    const { data: departments } = await supabase
      .from("departments")
      .select("id, name")
      .in("id", deptIds);

    for (const dept of departments ?? []) {
      departmentNames.set(dept.id as string, dept.name as string);
    }
  }

  return (fallback.data ?? []).map((row) =>
    normalizeEntry({
      id: row.id as string,
      dak_number: row.dak_number as string,
      subject: row.subject as string,
      sender: row.sender as string,
      priority: row.priority as PriorityLevel,
      status: row.status as string,
      due_date: row.due_date as string | null,
      departments: row.department_id
        ? {
            name:
              departmentNames.get(row.department_id as string) ?? "Department",
          }
        : null,
    } as DakListEntry & { status: string })
  );
}

/** Fetch DAK entries for list views with optional status filter. */
export async function getDakList(
  filter: DakListFilter = "all",
  departmentId?: string | null
): Promise<DakListEntry[]> {
  return fetchDakListRows(filter, departmentId);
}

/** Role-aware dashboard statistics — delegates to reports analytics service. */
export async function getDashboardStats(
  user: SessionUser
): Promise<DashboardStats> {
  return fetchDashboardStatsSummary(user);
}
