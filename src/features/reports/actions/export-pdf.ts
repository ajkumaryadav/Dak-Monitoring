"use server";

import { z } from "zod";

import {
  fetchReportRowsForExport,
  getReportExportTitle,
  getReportFilenamePrefix,
} from "@/features/reports/services/report-export-data";
import { generatePdfFile } from "@/features/reports/services/report-export.server";
import type { PendingReportFilters } from "@/features/reports/services/pending-report";
import {
  canExportReportKind,
  type ReportExportKind,
} from "@/lib/auth/report-permissions";
import { getSessionUser } from "@/lib/session";
import type { DakStatus, PriorityLevel } from "@/types";

const exportPdfSchema = z.object({
  reportKind: z.enum([
    "pending",
    "overdue",
    "source",
    "department",
    "section",
  ]),
  filters: z.object({
    departmentId: z.string().optional(),
    sourceId: z.string().optional(),
    assignmentUnitId: z.string().optional(),
    priority: z.string().optional(),
    status: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    overdueOnly: z.boolean().optional(),
  }),
  sourceName: z.string().optional(),
});

export type ExportPdfInput = z.infer<typeof exportPdfSchema>;

export type ExportPdfResult =
  | {
      success: true;
      fileBase64: string;
      filename: string;
      mimeType: string;
      rowCount: number;
    }
  | { success: false; message: string };

function normalizeFilters(
  filters: ExportPdfInput["filters"]
): PendingReportFilters {
  return {
    departmentId: filters.departmentId,
    sourceId: filters.sourceId,
    assignmentUnitId: filters.assignmentUnitId,
    priority: (filters.priority ?? "") as PriorityLevel | "",
    status: (filters.status ?? "") as DakStatus | "",
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    overdueOnly: filters.overdueOnly,
  };
}

/** Server action — export filtered report rows as PDF with RBAC. */
export async function exportPdfReport(
  input: ExportPdfInput
): Promise<ExportPdfResult> {
  try {
    const parsed = exportPdfSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid export request.",
      };
    }

    const user = await getSessionUser();

    if (!user) {
      return {
        success: false,
        message: "Your session has expired. Please sign in again.",
      };
    }

    const { reportKind, filters, sourceName } = parsed.data;

    if (!canExportReportKind(user.role, reportKind as ReportExportKind)) {
      return {
        success: false,
        message: "You do not have permission to export this report.",
      };
    }

    const rows = await fetchReportRowsForExport(
      user,
      reportKind as ReportExportKind,
      normalizeFilters(filters),
      sourceName
    );

    if (!rows.length) {
      return { success: false, message: "No records found for the current filters." };
    }

    const title = getReportExportTitle(reportKind as ReportExportKind, sourceName);
    const file = generatePdfFile(
      rows,
      getReportFilenamePrefix(reportKind as ReportExportKind, sourceName),
      title,
      user.name
    );

    return {
      success: true,
      fileBase64: file.buffer.toString("base64"),
      filename: file.filename,
      mimeType: file.mimeType,
      rowCount: rows.length,
    };
  } catch (error) {
    console.error("[exportPdfReport]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Export failed due to an unexpected error.",
    };
  }
}
