import type { DakListFilters } from "@/features/dak/services/get-dak-stats";
import type { DakStatus, PriorityLevel } from "@/types";

export interface DakListSearchParams {
  q?: string;
  department?: string;
  source?: string;
  section?: string;
  priority?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: string;
}

export function parseDakListParams(
  params: DakListSearchParams
): { searchQuery: string; filters: Omit<DakListFilters, "searchQuery"> } {
  return {
    searchQuery: params.q?.trim() ?? "",
    filters: {
      filterDepartmentId: params.department,
      sourceId: params.source,
      assignmentUnitId: params.section,
      priority: (params.priority ?? "") as PriorityLevel | "",
      status: (params.status ?? "") as DakStatus | "",
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      overdueOnly: params.overdue === "1",
    },
  };
}

export function hasActiveListFilters(
  filters: Omit<DakListFilters, "searchQuery">
): boolean {
  return Boolean(
    filters.filterDepartmentId ||
      filters.sourceId ||
      filters.assignmentUnitId ||
      filters.priority ||
      filters.status ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.overdueOnly
  );
}
