import type {
  PendingReportFilters,
  PendingReportRow,
} from "@/features/reports/services/pending-report";
import {
  fetchDepartmentAssignmentReport,
  fetchPendingReport,
  fetchSectionReport,
  fetchSourceReport,
} from "@/features/reports/services/pending-report";
import type { ReportExportKind } from "@/lib/auth/report-permissions";
import type { SessionUser } from "@/types";

export async function fetchReportRowsForExport(
  user: SessionUser,
  kind: ReportExportKind,
  filters: PendingReportFilters,
  sourceName?: string
): Promise<PendingReportRow[]> {
  switch (kind) {
    case "overdue":
      return fetchPendingReport(user, { ...filters, overdueOnly: true });
    case "source":
      return fetchSourceReport(user, sourceName ?? "Unknown", filters);
    case "department":
      return fetchDepartmentAssignmentReport(user, filters);
    case "section":
      return fetchSectionReport(user, filters);
    case "pending":
    default:
      return fetchPendingReport(user, filters);
  }
}

export function getReportExportTitle(
  kind: ReportExportKind,
  sourceName?: string
): string {
  switch (kind) {
    case "overdue":
      return "Overdue DAK Report";
    case "source":
      return `${sourceName ?? "Source"} DAK Report`;
    case "department":
      return "Department-wise DAK Report";
    case "section":
      return "Section-wise DAK Report";
    case "pending":
    default:
      return "Pending DAK Report";
  }
}

export function getReportFilenamePrefix(
  kind: ReportExportKind,
  sourceName?: string
): string {
  switch (kind) {
    case "overdue":
      return "overdue-dak-report";
    case "source":
      return `source-${(sourceName ?? "report").toLowerCase().replace(/\s+/g, "-")}`;
    case "department":
      return "department-dak-report";
    case "section":
      return "section-dak-report";
    case "pending":
    default:
      return "pending-dak-report";
  }
}
