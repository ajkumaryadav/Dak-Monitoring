import type { PendingReportFilters } from "@/features/reports/services/pending-report";
import { sanitizeDateRangeParams } from "@/lib/validation/date-range";
import type { DakStatus, PriorityLevel } from "@/types";

/** URL search params for report list pages (mirrors DakListSearchParams). */
export interface ReportSearchParams {
  name?: string;
  department?: string;
  source?: string;
  section?: string;
  priority?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: string;
}

export type ReportFilterValues = ReportSearchParams;

export function parseReportFilters(params: ReportSearchParams): PendingReportFilters {
  const { dateFrom, dateTo } = sanitizeDateRangeParams(
    params.dateFrom,
    params.dateTo
  );

  return {
    departmentId: params.department,
    sourceId: params.source,
    assignmentUnitId: params.section,
    priority: (params.priority ?? "") as PriorityLevel | "",
    status: (params.status ?? "") as DakStatus | "",
    dateFrom,
    dateTo,
    overdueOnly: params.overdue === "1",
  };
}

export function parseReportFiltersFromSearchParams(
  searchParams: URLSearchParams
): PendingReportFilters {
  return parseReportFilters({
    name: searchParams.get("name") ?? undefined,
    department: searchParams.get("department") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    section: searchParams.get("section") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    overdue: searchParams.get("overdue") ?? undefined,
  });
}

export function hasActiveReportFilters(params: ReportSearchParams): boolean {
  return Boolean(
    params.department ||
      params.source ||
      params.section ||
      params.priority ||
      params.status ||
      params.dateFrom ||
      params.dateTo ||
      params.overdue === "1"
  );
}
