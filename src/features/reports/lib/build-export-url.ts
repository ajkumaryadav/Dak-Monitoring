import type { ReportExportKind } from "@/lib/auth/report-permissions";
import type { ReportFilterValues } from "@/features/reports/lib/parse-report-filters";

/** Build a download URL for the reports export API route. */
export function buildReportExportUrl(
  format: "pdf" | "excel",
  reportKind: ReportExportKind,
  params: ReportFilterValues
): string {
  const search = new URLSearchParams();
  search.set("format", format);
  search.set("reportKind", reportKind);

  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  return `/api/reports/export?${search.toString()}`;
}
