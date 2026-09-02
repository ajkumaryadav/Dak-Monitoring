"use client";

import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportExcelReport } from "@/features/reports/actions/export-excel";
import { exportPdfReport } from "@/features/reports/actions/export-pdf";
import { downloadReportFile } from "@/features/reports/lib/download-report-file";
import type { ReportFilterValues } from "@/features/reports/lib/parse-report-filters";
import type { ReportExportKind } from "@/lib/auth/report-permissions";
import { cn } from "@/lib/utils";

interface ReportExportButtonsProps {
  reportKind: ReportExportKind;
  filterValues: ReportFilterValues;
  canExport: boolean;
  rowCount: number;
  sourceName?: string;
  className?: string;
}

function buildFiltersFromValues(values: ReportFilterValues) {
  return {
    departmentId: values.department || undefined,
    sourceId: values.source || undefined,
    assignmentUnitId: values.section || undefined,
    priority: values.priority || undefined,
    status: values.status || undefined,
    dateFrom: values.dateFrom || undefined,
    dateTo: values.dateTo || undefined,
    overdueOnly: values.overdue === "1",
  };
}

/** Client export buttons — onClick triggers server actions (no useSearchParams). */
export function ReportExportButtons({
  reportKind,
  filterValues,
  canExport,
  rowCount,
  sourceName,
  className,
}: ReportExportButtonsProps) {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  if (!canExport) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Export is not available for your role.
      </p>
    );
  }

  async function handleExport(format: "pdf" | "excel") {
    setExporting(format);

    try {
      const payload = {
        reportKind,
        filters: buildFiltersFromValues(filterValues),
        sourceName,
      };

      const result =
        format === "pdf"
          ? await exportPdfReport(payload)
          : await exportExcelReport(payload);

      if (!result.success) {
        if (result.message.toLowerCase().includes("no records")) {
          toast.warning("No records found", {
            description: result.message,
          });
        } else {
          toast.error("Export failed", { description: result.message });
        }
        return;
      }

      downloadReportFile(result.fileBase64, result.filename, result.mimeType);
      toast.success("Export successful", {
        description: `${result.rowCount} record${result.rowCount === 1 ? "" : "s"} exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("[ReportExportButtons]", error);
      toast.error("Export failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!rowCount || exporting !== null}
          onClick={() => void handleExport("pdf")}
          className="h-9 gap-1.5 border-blue-600/30 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-200"
        >
          {exporting === "pdf" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4" />
          )}
          Export PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!rowCount || exporting !== null}
          onClick={() => void handleExport("excel")}
          className="h-9 gap-1.5 border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {exporting === "excel" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="size-4" />
          )}
          Export Excel
        </Button>
        {!rowCount && (
          <span className="text-xs text-muted-foreground">No rows to export</span>
        )}
      </div>
    </div>
  );
}
