"use server";

import {
  fetchPendingReport,
  type PendingReportFilters,
  type PendingReportRow,
} from "@/features/reports/services/pending-report";
import { fetchReportRowsForExport } from "@/features/reports/services/report-export-data";
import type { ReportExportKind } from "@/lib/auth/report-permissions";
import { getSessionUser } from "@/lib/session";

export type ReportRowsResult =
  | { success: true; rows: PendingReportRow[] }
  | { success: false; rows: PendingReportRow[]; message: string };

/** Server action — fetch pending/overdue DAK rows with report filters. */
export async function getPendingReport(
  filters: PendingReportFilters = {}
): Promise<PendingReportRow[]> {
  const user = await getSessionUser();

  if (!user) {
    return [];
  }

  return fetchPendingReport(user, filters);
}

/** Server action — fetch report rows for any report kind (used by client filter refresh). */
export async function getReportRows(
  reportKind: ReportExportKind,
  filters: PendingReportFilters,
  sourceName?: string
): Promise<ReportRowsResult> {
  try {
    const user = await getSessionUser();

    if (!user) {
      return {
        success: false,
        rows: [],
        message: "Your session has expired. Please sign in again.",
      };
    }

    const rows = await fetchReportRowsForExport(
      user,
      reportKind,
      filters,
      sourceName
    );

    return { success: true, rows };
  } catch (error) {
    console.error("[getReportRows]", error);
    return {
      success: false,
      rows: [],
      message:
        error instanceof Error
          ? error.message
          : "Failed to load report data.",
    };
  }
}
