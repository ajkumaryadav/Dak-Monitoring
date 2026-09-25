"use server";

import {
  fetchPendingReport,
  type PendingReportFilters,
  type PendingReportRow,
} from "@/features/reports/services/pending-report";
import { fetchReportRowsForExport } from "@/features/reports/services/report-export-data";
import type { ReportExportKind } from "@/lib/auth/report-permissions";
import { getSessionUser } from "@/lib/session";
import { formatSafeErrorMessage, logSafeError } from "@/lib/security/errors";

export type ReportRowsResult =
  | { success: true; rows: PendingReportRow[] }
  | { success: false; rows: PendingReportRow[]; message: string };

/** Server action — fetch pending/overdue DAK rows with report filters. */
export async function getPendingReport(
  filters: PendingReportFilters = {}
): Promise<PendingReportRow[]> {
  try {
    const user = await getSessionUser();

    if (!user) {
      return [];
    }

    return await fetchPendingReport(user, filters);
  } catch (err: unknown) {
    logSafeError("getPendingReport", err);
    return [];
  }
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
  } catch (error: unknown) {
    logSafeError("getReportRows", error);
    return {
      success: false,
      rows: [],
      message: formatSafeErrorMessage(error, "Failed to load report data."),
    };
  }
}
