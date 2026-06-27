import { createAdminClient } from "@/lib/supabase/admin";
import { getDepartmentName, getSourceName, getUnitName } from "@/features/dak/lib/dak-display";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import {
  LEGACY_COMPLETED_DB_STATUSES,
  isTerminalStatus,
  normalizeDakStatus,
} from "@/features/dak/lib/workflow";
import { fetchDashboardStatsSummary } from "@/features/reports/services/dashboard-analytics";
import type { SessionUser } from "@/types";
import type { AssignmentType, DakStatus, PriorityLevel } from "@/types";

export type DakListFilter = "all" | "pending" | "completed" | "assignments";

export interface DakListFilters {
  searchQuery?: string;
  departmentId?: string | null;
  filterDepartmentId?: string;
  sourceId?: string;
  assignmentUnitId?: string;
  status?: DakStatus | "";
  priority?: PriorityLevel | "";
  dateFrom?: string;
  dateTo?: string;
  overdueOnly?: boolean;
}

export interface DakListEntry {
  id: string;
  dak_number: string;
  subject: string;
  sender: string;
  priority: PriorityLevel;
  status: DakStatus;
  due_date: string | null;
  received_date: string | null;
  created_at: string;
  department_id: string | null;
  assignment_type: AssignmentType | null;
  source_id?: string | null;
  assignment_unit_id?: string | null;
  departments: { name: string } | { name: string }[] | null;
  dak_sources: { source_name: string } | { source_name: string }[] | null;
  assignment_units:
    | { unit_name: string }
    | { unit_name: string }[]
    | null;
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

const LIST_SELECT =
  "id, dak_number, subject, sender, priority, status, due_date, received_date, created_at, department_id, assignment_type, source_id, assignment_unit_id, departments(name), dak_sources(source_name), assignment_units(unit_name)";

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
    getSourceName(entry.dak_sources),
    getUnitName(entry.assignment_units),
  ]
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

function applyClientFilters(
  entries: DakListEntry[],
  filters: DakListFilters
): DakListEntry[] {
  let result = entries;

  if (filters.filterDepartmentId) {
    result = result.filter(
      (entry) => entry.department_id === filters.filterDepartmentId
    );
  }

  if (filters.sourceId) {
    result = result.filter((entry) => entry.source_id === filters.sourceId);
  }

  if (filters.assignmentUnitId) {
    result = result.filter(
      (entry) => entry.assignment_unit_id === filters.assignmentUnitId
    );
  }

  if (filters.status) {
    result = result.filter((entry) => entry.status === filters.status);
  }

  if (filters.priority) {
    result = result.filter((entry) => entry.priority === filters.priority);
  }

  if (filters.dateFrom) {
    result = result.filter((entry) => {
      const date = entry.received_date ?? entry.created_at?.slice(0, 10);
      return date ? date >= filters.dateFrom! : false;
    });
  }

  if (filters.dateTo) {
    result = result.filter((entry) => {
      const date = entry.received_date ?? entry.created_at?.slice(0, 10);
      return date ? date <= filters.dateTo! : false;
    });
  }

  if (filters.overdueOnly) {
    const today = getDistrictDateString();
    result = result.filter(
      (entry) =>
        entry.due_date &&
        entry.due_date < today &&
        !isTerminalStatus(entry.status)
    );
  }

  const term = sanitizeSearchTerm(filters.searchQuery ?? "");
  if (term) {
    result = result.filter((entry) => entryMatchesSearch(entry, term));
  }

  return result;
}

/** Filter a DAK list by search term and optional filters within the current list scope. */
export async function getFilteredDakList(
  filter: DakListFilter,
  searchQuery?: string,
  departmentId?: string | null,
  extraFilters: Omit<DakListFilters, "searchQuery" | "departmentId"> = {}
): Promise<DakListEntry[]> {
  const entries = await getDakList(filter, departmentId);
  return applyClientFilters(entries, {
    searchQuery,
    departmentId,
    ...extraFilters,
  });
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
    .select(LIST_SELECT)
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
      "id, dak_number, subject, sender, priority, status, due_date, received_date, created_at, assignment_type, department_id, source_id, assignment_unit_id"
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

  const sourceIds = [
    ...new Set(
      (fallback.data ?? [])
        .map((row) => row.source_id as string | null)
        .filter(Boolean)
    ),
  ] as string[];

  const unitIds = [
    ...new Set(
      (fallback.data ?? [])
        .map((row) => row.assignment_unit_id as string | null)
        .filter(Boolean)
    ),
  ] as string[];

  const departmentNames = new Map<string, string>();
  const sourceNames = new Map<string, string>();
  const unitNames = new Map<string, string>();

  if (deptIds.length) {
    const { data: departments } = await supabase
      .from("departments")
      .select("id, name")
      .in("id", deptIds);

    for (const dept of departments ?? []) {
      departmentNames.set(dept.id as string, dept.name as string);
    }
  }

  if (sourceIds.length) {
    const { data: sources } = await supabase
      .from("dak_sources")
      .select("id, source_name")
      .in("id", sourceIds);

    for (const source of sources ?? []) {
      sourceNames.set(source.id as string, source.source_name as string);
    }
  }

  if (unitIds.length) {
    const { data: units } = await supabase
      .from("assignment_units")
      .select("id, unit_name")
      .in("id", unitIds);

    for (const unit of units ?? []) {
      unitNames.set(unit.id as string, unit.unit_name as string);
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
      received_date: row.received_date as string | null,
      created_at: row.created_at as string,
      department_id: row.department_id as string | null,
      assignment_type: row.assignment_type as AssignmentType | null,
      departments: row.department_id
        ? {
            name:
              departmentNames.get(row.department_id as string) ?? "Department",
          }
        : null,
      dak_sources: row.source_id
        ? {
            source_name:
              sourceNames.get(row.source_id as string) ?? "Unknown",
          }
        : null,
      assignment_units: row.assignment_unit_id
        ? {
            unit_name:
              unitNames.get(row.assignment_unit_id as string) ?? "Section",
          }
        : null,
      source_id: row.source_id,
      assignment_unit_id: row.assignment_unit_id,
    } as DakListEntry & { status: string; source_id?: string; assignment_unit_id?: string })
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

export { PENDING_DB_STATUSES, COMPLETED_DB_STATUSES };
