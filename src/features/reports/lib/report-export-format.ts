import { formatDakDate } from "@/features/dak/lib/dak-display";
import { getStatusLabel } from "@/features/dak/lib/workflow";
import type { PendingReportRow } from "@/features/reports/services/pending-report";

export const EXCEL_EXPORT_COLUMNS = [
  { key: "dak_number", header: "DAK Number" },
  { key: "subject", header: "Subject" },
  { key: "source_name", header: "Source" },
  { key: "department_name", header: "Department" },
  { key: "section_name", header: "Section" },
  { key: "priority", header: "Priority" },
  { key: "status", header: "Status" },
  { key: "due_date", header: "Due Date" },
  { key: "received_date", header: "Received Date" },
] as const;

export function formatRowsForExcelExport(
  rows: PendingReportRow[]
): Record<string, string>[] {
  return rows.map((row) => ({
    dak_number: row.dak_number,
    subject: row.subject,
    source_name: row.source_name,
    department_name: row.department_name,
    section_name: row.section_name,
    priority: String(row.priority),
    status: getStatusLabel(String(row.status)),
    due_date: formatDakDate(row.due_date),
    received_date: formatDakDate(row.received_date),
  }));
}

export function formatRowsForPdfExport(
  rows: PendingReportRow[]
): Record<string, string>[] {
  return rows.map((row) => ({
    dak_number: row.dak_number,
    subject: row.subject,
    source_name: row.source_name,
    department_name: row.department_name,
    status: getStatusLabel(String(row.status)),
    priority: String(row.priority),
    due_date: formatDakDate(row.due_date),
  }));
}

export function buildExportFilename(prefix: string, extension: "xlsx" | "pdf") {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.${extension}`;
}
