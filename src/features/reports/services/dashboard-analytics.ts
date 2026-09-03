import { createAdminClient } from "@/lib/supabase/admin";
import {
  isActiveStatus,
  isTerminalStatus,
  LEGACY_COMPLETED_DB_STATUSES,
  normalizeDakStatus,
  getStatusLabel,
} from "@/features/dak/lib/workflow";
import { getDistrictDateString, addDaysToDateString } from "@/features/dak/lib/dak-dates";
import { DAK_SOURCE_WIDGETS } from "@/lib/constants/dak-sources";
import {
  isCollectorDashboardRole,
  isDepartmentDashboardRole,
  isOperatorDashboardRole,
  isSectionDashboardRole,
} from "@/lib/auth/permissions";
import type { SessionUser } from "@/types";
import type { AssignmentType, DakStatus, PriorityLevel } from "@/types";

const COMPLETED_DB_STATUSES = [
  "completed",
  "closed",
  ...LEGACY_COMPLETED_DB_STATUSES,
];

const PENDING_DB_STATUSES = [
  "received",
  "assigned",
  "in_progress",
  "pending",
  "under_process",
  "escalated",
];

function toIsoDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function toIsoDateString(val: unknown): string {
  return toIsoDate(val) ?? "";
}

export interface DashboardStatSummary {
  total: number;
  pending: number;
  assigned: number;
  overdue: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  completed: number;
  dueToday: number;
  dueThisWeek: number;
  completionRatePct: number;
  cmoDak: number;
  janSunwaiDak: number;
  mlaReferences: number;
  chiefSecretaryRefs: number;
  courtCases: number;
  internalSectionPending: number;
  departmentPending: number;
}

export interface DepartmentDashboardStatSummary {
  assigned: number;
  pendingActions: number;
  overdue: number;
  completed: number;
}

export interface OperatorDashboardStatSummary {
  registered: number;
  todayEntries: number;
  monthEntries: number;
  forwarded: number;
  returned: number;
}

export interface SectionDashboardStatSummary {
  assigned: number;
  pendingActions: number;
  completed: number;
}

export interface RecentDakRow {
  id: string;
  dak_number: string;
  subject: string;
  status: DakStatus;
  priority: PriorityLevel;
  department_name: string;
  source_name: string;
  due_date: string | null;
  created_at: string;
}

export interface DepartmentPerformanceRow {
  department_id: string;
  department_name: string;
  total: number;
  pending: number;
  overdue: number;
  completed: number;
}

export interface SectionPerformanceRow {
  unit_id: string;
  unit_name: string;
  total: number;
  pending: number;
  overdue: number;
  completed: number;
}

export interface ChartCountRow {
  label: string;
  value: number;
}

export interface CollectorDashboardData {
  variant: "collector";
  stats: DashboardStatSummary;
  recentDak: RecentDakRow[];
  departmentPerformance: DepartmentPerformanceRow[];
  pendingDepartments: DepartmentPerformanceRow[];
  sectionPerformance: SectionPerformanceRow[];
  pendingSections: SectionPerformanceRow[];
  priorityChart: ChartCountRow[];
  statusChart: ChartCountRow[];
  sourceChart: ChartCountRow[];
}

export interface DepartmentDashboardData {
  variant: "department";
  departmentName: string;
  stats: DepartmentDashboardStatSummary;
  recentDak: RecentDakRow[];
  priorityChart: ChartCountRow[];
  statusChart: ChartCountRow[];
}

export interface SectionDashboardData {
  variant: "section";
  sectionName: string;
  stats: SectionDashboardStatSummary;
  recentDak: RecentDakRow[];
  priorityChart: ChartCountRow[];
  statusChart: ChartCountRow[];
}

export interface OperatorDashboardData {
  variant: "operator";
  stats: OperatorDashboardStatSummary;
  recentDak: RecentDakRow[];
}

export type DashboardAnalytics =
  | CollectorDashboardData
  | DepartmentDashboardData
  | SectionDashboardData
  | OperatorDashboardData;

type RawEntry = {
  id: string;
  dak_number: string;
  subject: string;
  status: string;
  priority: PriorityLevel;
  due_date: string | null;
  created_at: string;
  department_id: string | null;
  source_id: string | null;
  assignment_type: AssignmentType | null;
  assignment_unit_id: string | null;
  departments: { name: string } | { name: string }[] | null;
  dak_sources: { source_name: string } | { source_name: string }[] | null;
  assignment_units:
    | { unit_name: string }
    | { unit_name: string }[]
    | null;
};

function isCompletedDbStatus(status: string): boolean {
  return (
    isTerminalStatus(status) || COMPLETED_DB_STATUSES.includes(status)
  );
}

function isPendingDbStatus(status: string): boolean {
  return isActiveStatus(status) && !isCompletedDbStatus(status);
}

function getDepartmentName(
  departments: RawEntry["departments"]
): string {
  if (!departments) return "Unassigned";
  if (Array.isArray(departments)) return departments[0]?.name ?? "Unassigned";
  return departments.name ?? "Unassigned";
}

function getSourceName(entry: RawEntry): string {
  const source = entry.dak_sources;
  if (!source) return "Unknown";
  if (Array.isArray(source)) return source[0]?.source_name ?? "Unknown";
  return source.source_name ?? "Unknown";
}

function getUnitName(entry: RawEntry): string {
  const unit = entry.assignment_units;
  if (!unit) return "Unassigned";
  if (Array.isArray(unit)) return unit[0]?.unit_name ?? "Unassigned";
  return unit.unit_name ?? "Unassigned";
}

function countBySource(entries: RawEntry[], sourceName: string): number {
  return entries.filter(
    (entry) =>
      getSourceName(entry) === sourceName && isPendingDbStatus(entry.status)
  ).length;
}

function toRecentRow(entry: RawEntry): RecentDakRow {
  return {
    id: entry.id,
    dak_number: entry.dak_number,
    subject: entry.subject,
    status: normalizeDakStatus(entry.status),
    priority: entry.priority,
    department_name: getDepartmentName(entry.departments),
    source_name: getSourceName(entry),
    due_date: entry.due_date,
    created_at: entry.created_at,
  };
}

function buildDepartmentPerformance(
  entries: RawEntry[],
  today: string
): DepartmentPerformanceRow[] {
  const map = new Map<string, DepartmentPerformanceRow>();

  for (const entry of entries) {
    if (entry.assignment_type === "section") continue;

    const deptId = entry.department_id ?? "unassigned";
    const deptName = getDepartmentName(entry.departments);
    const status = entry.status as string;

    const row = map.get(deptId) ?? {
      department_id: deptId,
      department_name: deptName,
      total: 0,
      pending: 0,
      overdue: 0,
      completed: 0,
    };

    row.total += 1;

    if (isPendingDbStatus(status)) row.pending += 1;
    if (isCompletedDbStatus(status)) row.completed += 1;
    if (
      entry.due_date &&
      entry.due_date < today &&
      !isCompletedDbStatus(status)
    ) {
      row.overdue += 1;
    }

    map.set(deptId, row);
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function buildSectionPerformance(
  entries: RawEntry[],
  today: string
): SectionPerformanceRow[] {
  const map = new Map<string, SectionPerformanceRow>();

  for (const entry of entries) {
    if (entry.assignment_type !== "section") continue;

    const unitId = entry.assignment_unit_id ?? "unassigned";
    const unitName = getUnitName(entry);
    const status = entry.status as string;

    const row = map.get(unitId) ?? {
      unit_id: unitId,
      unit_name: unitName,
      total: 0,
      pending: 0,
      overdue: 0,
      completed: 0,
    };

    row.total += 1;
    if (isPendingDbStatus(status)) row.pending += 1;
    if (isCompletedDbStatus(status)) row.completed += 1;
    if (
      entry.due_date &&
      entry.due_date < today &&
      !isCompletedDbStatus(status)
    ) {
      row.overdue += 1;
    }

    map.set(unitId, row);
  }

  return Array.from(map.values()).sort((a, b) => b.pending - a.pending);
}

function buildPriorityChart(entries: RawEntry[]): ChartCountRow[] {
  const counts: Record<PriorityLevel, number> = {
    routine: 0,
    important: 0,
    urgent: 0,
    immediate: 0,
  };

  for (const entry of entries) {
    if (isCompletedDbStatus(entry.status)) continue;

    const priority = entry.priority;
    if (priority in counts) {
      counts[priority as PriorityLevel] += 1;
    } else {
      counts.routine += 1;
    }
  }

  return [
    { label: "Routine", value: counts.routine },
    { label: "Important", value: counts.important },
    { label: "Urgent", value: counts.urgent },
    { label: "Immediate", value: counts.immediate },
  ];
}

function buildStatusChart(entries: RawEntry[]): ChartCountRow[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const label = getStatusLabel(entry.status);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([label, value]) => ({
    label,
    value,
  }));
}

function buildSourceChart(entries: RawEntry[]): ChartCountRow[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    if (isCompletedDbStatus(entry.status)) continue;
    const label = getSourceName(entry);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

/** Fetch DAK rows for dashboard analytics with join fallback. */
async function fetchDashboardEntries(
  supabase: ReturnType<typeof createAdminClient>,
  scope?: {
    departmentId?: string | null;
    sectionId?: string | null;
    createdBy?: string | null;
  }
): Promise<RawEntry[]> {
  let query = supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, status, priority, due_date, created_at, department_id, source_id, assignment_type, assignment_unit_id, created_by, departments(name), dak_sources(source_name), assignment_units(unit_name)"
    )
    .order("created_at", { ascending: false });

  if (scope?.departmentId) {
    query = query.eq("department_id", scope.departmentId);
  }

  if (scope?.sectionId) {
    query = query.eq("assignment_unit_id", scope.sectionId);
  }

  if (scope?.createdBy) {
    query = query.eq("created_by", scope.createdBy);
  }

  const { data, error } = await query;

  if (!error && data?.length) {
    return data as RawEntry[];
  }

  if (error) {
    console.error("[fetchDashboardAnalytics] join query failed:", error.message);
  }

  let fallbackQuery = supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, status, priority, due_date, created_at, department_id, source_id, assignment_type, assignment_unit_id, created_by"
    )
    .order("created_at", { ascending: false });

  if (scope?.departmentId) {
    fallbackQuery = fallbackQuery.eq("department_id", scope.departmentId);
  }

  if (scope?.sectionId) {
    fallbackQuery = fallbackQuery.eq("assignment_unit_id", scope.sectionId);
  }

  if (scope?.createdBy) {
    fallbackQuery = fallbackQuery.eq("created_by", scope.createdBy);
  }

  const fallback = await fallbackQuery;

  if (fallback.error) {
    console.error("[fetchDashboardAnalytics] fallback failed:", fallback.error.message);
    return [];
  }

  const departmentIds = [
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

  if (departmentIds.length) {
    const { data: departments } = await supabase
      .from("departments")
      .select("id, name")
      .in("id", departmentIds);

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

  let resultList: RawEntry[] = [];
  if (!error && data?.length) {
    resultList = data as RawEntry[];
  } else {
    resultList = (fallback.data ?? []).map((row) => ({
      id: row.id as string,
      dak_number: row.dak_number as string,
      subject: row.subject as string,
      status: row.status as string,
      priority: row.priority as PriorityLevel,
      due_date: row.due_date as string | null,
      created_at: row.created_at as string,
      department_id: row.department_id as string | null,
      source_id: row.source_id as string | null,
      assignment_type: row.assignment_type as AssignmentType | null,
      assignment_unit_id: row.assignment_unit_id as string | null,
      departments: row.department_id
        ? { name: departmentNames.get(row.department_id as string) ?? "Department" }
        : null,
      dak_sources: row.source_id
        ? { source_name: sourceNames.get(row.source_id as string) ?? "Unknown" }
        : null,
      assignment_units: row.assignment_unit_id
        ? { unit_name: unitNames.get(row.assignment_unit_id as string) ?? "Section" }
        : null,
    }));
  }

  if (!scope?.createdBy && resultList.length > 0) {
    const { getRecalledDakIdSet } = await import("@/features/dak/lib/recalled-dak");
    const recalledIds = await getRecalledDakIdSet(resultList.map((r) => r.id));
    return resultList.filter((r) => !recalledIds.has(r.id));
  }

  return resultList;
}

function buildScopedStats(
  entries: RawEntry[],
  today: string,
  includeOverdue: boolean
): DepartmentDashboardStatSummary {
  let assigned = 0;
  let pendingActions = 0;
  let completed = 0;
  let overdue = 0;

  for (const entry of entries) {
    const status = entry.status;
    if (
      ["assigned", "in_progress", "pending", "under_process"].includes(status)
    ) {
      assigned += 1;
    }
    if (
      ["in_progress", "pending", "under_process", "assigned"].includes(status)
    ) {
      pendingActions += 1;
    }
    if (isCompletedDbStatus(status)) completed += 1;
    const dueIso = toIsoDate(entry.due_date);
    if (
      includeOverdue &&
      dueIso &&
      dueIso < today &&
      !isCompletedDbStatus(status)
    ) {
      overdue += 1;
    }
  }

  return { assigned, pendingActions, overdue, completed };
}

async function fetchOperatorDashboardAnalytics(
  user: SessionUser
): Promise<OperatorDashboardData> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();
  const entries = await fetchDashboardEntries(supabase, {
    createdBy: user.id,
  });

  let todayEntries = 0;
  let monthEntries = 0;
  let returned = 0;

  const monthPrefix = today.slice(0, 7);

  for (const entry of entries) {
    const createdDate = toIsoDateString(entry.created_at);
    if (createdDate === today) todayEntries += 1;
    if (createdDate.startsWith(monthPrefix)) monthEntries += 1;
  }

  const forwarded = entries.length;

  return {
    variant: "operator",
    stats: {
      registered: entries.length,
      todayEntries,
      monthEntries,
      forwarded,
      returned,
    },
    recentDak: entries.slice(0, 10).map(toRecentRow),
  };
}

async function fetchDepartmentDashboardAnalytics(
  user: SessionUser
): Promise<DepartmentDashboardData> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();
  const entries = await fetchDashboardEntries(supabase, {
    departmentId: user.departmentId,
  });

  const deptName =
    entries[0] ? getDepartmentName(entries[0].departments) : "Department";

  return {
    variant: "department",
    departmentName: deptName,
    stats: buildScopedStats(entries, today, true),
    recentDak: entries.slice(0, 8).map(toRecentRow),
    priorityChart: buildPriorityChart(entries),
    statusChart: buildStatusChart(entries),
  };
}

async function fetchSectionDashboardAnalytics(
  user: SessionUser
): Promise<SectionDashboardData> {
  const supabase = createAdminClient();
  const entries = await fetchDashboardEntries(supabase, {
    sectionId: user.sectionId,
  });

  const sectionName =
    entries[0] ? getUnitName(entries[0]) : "Section";

  const scoped = buildScopedStats(entries, getDistrictDateString(), false);

  return {
    variant: "section",
    sectionName,
    stats: {
      assigned: scoped.assigned,
      pendingActions: scoped.pendingActions,
      completed: scoped.completed,
    },
    recentDak: entries.slice(0, 8).map(toRecentRow),
    priorityChart: buildPriorityChart(entries),
    statusChart: buildStatusChart(entries),
  };
}

async function fetchCollectorDashboardAnalytics(): Promise<CollectorDashboardData> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();
  const weekEnd = addDaysToDateString(today, 7);
  const entries = await fetchDashboardEntries(supabase);
  const highPrioritySet = new Set<PriorityLevel>(["urgent", "immediate"]);

  let pending = 0;
  let assigned = 0;
  let completed = 0;
  let highPriority = 0;
  let mediumPriority = 0;
  let lowPriority = 0;
  let overdue = 0;
  let dueToday = 0;
  let dueThisWeek = 0;
  let internalSectionPending = 0;
  let departmentPending = 0;

  for (const entry of entries) {
    const status = entry.status;
    const due = toIsoDate(entry.due_date);
    const isDone = isCompletedDbStatus(status);

    if (isPendingDbStatus(status)) {
      pending += 1;
      if (entry.assignment_type === "section") internalSectionPending += 1;
      if (entry.assignment_type === "department" || entry.department_id) {
        departmentPending += 1;
      }
      if (status === "assigned") assigned += 1;
      if (!isDone && highPrioritySet.has(entry.priority)) highPriority += 1;
      if (!isDone && entry.priority === "important") mediumPriority += 1;
      if (!isDone && entry.priority === "routine") lowPriority += 1;
    }
    if (isDone) completed += 1;
    if (due && due < today && !isDone) overdue += 1;
    if (due === today && !isDone) dueToday += 1;
    if (due && due > today && due <= weekEnd && !isDone) dueThisWeek += 1;
  }

  const departmentPerformance = buildDepartmentPerformance(entries, today);
  const pendingDepartments = [...departmentPerformance]
    .filter((d) => d.pending > 0)
    .sort((a, b) => b.pending - a.pending);

  const sectionPerformance = buildSectionPerformance(entries, today);
  const pendingSections = [...sectionPerformance]
    .filter((s) => s.pending > 0)
    .sort((a, b) => b.pending - a.pending);

  return {
    variant: "collector",
    stats: {
      total: entries.length,
      pending,
      assigned,
      overdue,
      highPriority,
      mediumPriority,
      lowPriority,
      completed,
      dueToday,
      dueThisWeek,
      completionRatePct:
        entries.length > 0
          ? Math.round((completed / entries.length) * 100)
          : 0,
      cmoDak: countBySource(entries, DAK_SOURCE_WIDGETS.CMO),
      janSunwaiDak: countBySource(entries, DAK_SOURCE_WIDGETS.JAN_SUNWAI),
      mlaReferences: countBySource(entries, DAK_SOURCE_WIDGETS.MLA),
      chiefSecretaryRefs: countBySource(
        entries,
        DAK_SOURCE_WIDGETS.CHIEF_SECRETARY
      ),
      courtCases: countBySource(entries, DAK_SOURCE_WIDGETS.COURT),
      internalSectionPending,
      departmentPending,
    },
    recentDak: entries.slice(0, 8).map(toRecentRow),
    departmentPerformance,
    pendingDepartments,
    sectionPerformance,
    pendingSections,
    priorityChart: buildPriorityChart(entries),
    statusChart: buildStatusChart(entries),
    sourceChart: buildSourceChart(entries),
  };
}

/** Fetch dashboard analytics scoped by role. */
export async function fetchDashboardAnalytics(
  user: SessionUser
): Promise<DashboardAnalytics> {
  if (isOperatorDashboardRole(user.role)) {
    return fetchOperatorDashboardAnalytics(user);
  }

  if (isSectionDashboardRole(user.role) && user.sectionId) {
    return fetchSectionDashboardAnalytics(user);
  }

  if (isDepartmentDashboardRole(user.role) && user.departmentId) {
    return fetchDepartmentDashboardAnalytics(user);
  }

  if (isCollectorDashboardRole(user.role)) {
    return fetchCollectorDashboardAnalytics();
  }

  // Fallback — treat unknown roles as operator-scoped when possible
  return fetchOperatorDashboardAnalytics(user);
}

/** Legacy summary stats — re-exported for list pages. */
export async function fetchDashboardStatsSummary(user: SessionUser) {
  const data = await fetchDashboardAnalytics(user);

  if (data.variant === "operator") {
    return {
      variant: "operator" as const,
      registered: data.stats.registered,
      todayEntries: data.stats.todayEntries,
      monthEntries: data.stats.monthEntries,
      forwarded: data.stats.forwarded,
      returned: data.stats.returned,
    };
  }

  if (data.variant === "section") {
    return {
      variant: "section" as const,
      assigned: data.stats.assigned,
      pendingActions: data.stats.pendingActions,
      completed: data.stats.completed,
    };
  }

  if (data.variant === "department") {
    return {
      variant: "department" as const,
      assigned: data.stats.assigned,
      pendingActions: data.stats.pendingActions,
      overdue: data.stats.overdue,
      completed: data.stats.completed,
    };
  }

  return {
    variant: "collector" as const,
    total: data.stats.total,
    pending: data.stats.pending,
    overdue: data.stats.overdue,
    completed: data.stats.completed,
    highPriority: data.stats.highPriority,
    cmoDak: data.stats.cmoDak,
    janSunwaiDak: data.stats.janSunwaiDak,
    mlaReferences: data.stats.mlaReferences,
    chiefSecretaryRefs: data.stats.chiefSecretaryRefs,
    courtCases: data.stats.courtCases,
    internalSectionPending: data.stats.internalSectionPending,
    departmentPending: data.stats.departmentPending,
  };
}

export interface OfficerPerformanceRow {
  officer_id: string;
  officer_name: string;
  department_name: string;
  pending: number;
  overdue: number;
  completed: number;
  avg_disposal_days: number | null;
}

/** Officer-wise pending, overdue, completed, and average disposal time. */
export async function fetchOfficerPerformance(): Promise<OfficerPerformanceRow[]> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();

  const { data, error } = await supabase
    .from("dak_entries")
    .select(
      "id, status, due_date, received_date, closed_date, assigned_to, users!dak_entries_assigned_to_fkey(id, name, department_id, departments(name))"
    )
    .not("assigned_to", "is", null);

  if (error || !data) {
    console.error("[fetchOfficerPerformance]", error?.message);
    return [];
  }

  const byOfficer = new Map<
    string,
    OfficerPerformanceRow & { disposalDays: number[] }
  >();

  for (const row of data) {
    const user = row.users as
      | { id: string; name: string; departments: { name: string } | { name: string }[] | null }
      | { id: string; name: string; departments: { name: string } | { name: string }[] | null }[]
      | null;
    const officer = Array.isArray(user) ? user[0] : user;
    if (!officer?.id) continue;

    const status = normalizeDakStatus(row.status as string);
    const entry = byOfficer.get(officer.id) ?? {
      officer_id: officer.id,
      officer_name: officer.name,
      department_name: Array.isArray(officer.departments)
        ? officer.departments[0]?.name ?? "—"
        : officer.departments?.name ?? "—",
      pending: 0,
      overdue: 0,
      completed: 0,
      avg_disposal_days: null,
      disposalDays: [],
    };

    if (isTerminalStatus(status)) {
      entry.completed += 1;
      if (row.received_date && row.closed_date) {
        const days = Math.round(
          (Date.parse(row.closed_date as string) -
            Date.parse(row.received_date as string)) /
            86400000
        );
        if (days >= 0) entry.disposalDays.push(days);
      }
    } else if (isActiveStatus(status)) {
      entry.pending += 1;
      if (row.due_date && (row.due_date as string) < today) {
        entry.overdue += 1;
      }
    }

    byOfficer.set(officer.id, entry);
  }

  return [...byOfficer.values()]
    .map(({ disposalDays, ...row }) => ({
      ...row,
      avg_disposal_days:
        disposalDays.length > 0
          ? Math.round(
              disposalDays.reduce((a, b) => a + b, 0) / disposalDays.length
            )
          : null,
    }))
    .sort((a, b) => b.pending - a.pending);
}

export { PENDING_DB_STATUSES, COMPLETED_DB_STATUSES, isCompletedDbStatus };
