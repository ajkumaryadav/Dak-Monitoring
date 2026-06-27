"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getReportRows } from "@/features/reports/actions/get-pending-report";
import { PendingReportTable } from "@/features/reports/components/pending-report-table";
import { ReportExportButtons } from "@/features/reports/components/report-export-buttons";
import {
  parseReportFiltersFromSearchParams,
  type ReportFilterValues,
} from "@/features/reports/lib/parse-report-filters";
import type { PendingReportRow } from "@/features/reports/services/pending-report";
import type { ReportExportKind } from "@/lib/auth/report-permissions";

interface PendingReportResultsProps {
  initialRows: PendingReportRow[];
  reportKind: ReportExportKind;
  canExport: boolean;
  title: string;
  description: string;
  sourceName?: string;
}

function searchParamsToFilterValues(
  searchParams: URLSearchParams
): ReportFilterValues {
  return {
    name: searchParams.get("name") ?? undefined,
    department: searchParams.get("department") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    section: searchParams.get("section") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    overdue: searchParams.get("overdue") ?? undefined,
  };
}

/** Client results card — refetches when URL search params change. */
export function PendingReportResults({
  initialRows,
  reportKind,
  canExport,
  title,
  description,
  sourceName,
}: PendingReportResultsProps) {
  const searchParams = useSearchParams();
  const paramKey = searchParams.toString();
  const filterValues = useMemo(
    () => searchParamsToFilterValues(searchParams),
    [searchParams]
  );

  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      setLoading(true);
      setError(null);

      const filters = parseReportFiltersFromSearchParams(searchParams);
      const result = await getReportRows(reportKind, filters, sourceName);

      if (cancelled) return;

      if (!result.success) {
        setError(result.message);
        setRows([]);
      } else {
        setRows(result.rows);
      }

      setLoading(false);
    }

    void loadRows();

    return () => {
      cancelled = true;
    };
    // paramKey captures all filter URL changes without unstable searchParams reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey, reportKind, sourceName]);

  return (
    <Card className="border-primary/15">
      <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {loading
              ? "Loading report data…"
              : `${rows.length} record${rows.length === 1 ? "" : "s"} matching filters.`}
          </CardDescription>
        </div>
        <ReportExportButtons
          reportKind={reportKind}
          filterValues={filterValues}
          canExport={canExport}
          rowCount={rows.length}
          sourceName={sourceName}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Updating report…
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && (
          <p className="sr-only">{description}</p>
        )}
        <PendingReportTable rows={rows} />
      </CardContent>
    </Card>
  );
}
