import { FileSpreadsheet, FileText } from "lucide-react";
import Link from "next/link";

import { buildReportExportUrl } from "@/features/reports/lib/build-export-url";
import type { ReportFilterValues } from "@/features/reports/lib/parse-report-filters";
import type { ReportExportKind } from "@/lib/auth/report-permissions";
import { cn } from "@/lib/utils";

interface ReportExportLinksProps {
  reportKind: ReportExportKind;
  filterValues: ReportFilterValues;
  canExport: boolean;
  rowCount: number;
  className?: string;
}

const linkClassName =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

/** Server-rendered export links — no client JavaScript required. */
export function ReportExportLinks({
  reportKind,
  filterValues,
  canExport,
  rowCount,
  className,
}: ReportExportLinksProps) {
  if (!canExport) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Export is not available for your role.
      </p>
    );
  }

  const pdfHref = buildReportExportUrl("pdf", reportKind, filterValues);
  const excelHref = buildReportExportUrl("excel", reportKind, filterValues);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {rowCount > 0 ? (
          <>
            <Link
              href={pdfHref}
              className={cn(
                linkClassName,
                "border border-blue-600/30 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-200"
              )}
            >
              <FileText className="size-4" />
              Export PDF
            </Link>
            <Link
              href={excelHref}
              className={cn(
                linkClassName,
                "border border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200"
              )}
            >
              <FileSpreadsheet className="size-4" />
              Export Excel
            </Link>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No rows to export</span>
        )}
      </div>
    </div>
  );
}
