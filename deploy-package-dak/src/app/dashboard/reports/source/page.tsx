import Link from "next/link";
import { Layers } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { PendingReportFiltersPanel } from "@/features/reports/components/pending-report-filters-panel";
import { PendingReportTable } from "@/features/reports/components/pending-report-table";
import { ReportExportButtons } from "@/features/reports/components/report-export-buttons";
import {
  hasActiveReportFilters,
  parseReportFilters,
  type ReportSearchParams,
} from "@/features/reports/lib/parse-report-filters";
import { fetchSourceReport } from "@/features/reports/services/pending-report";
import {
  canExportReportKind,
  canExportReports,
} from "@/lib/auth/report-permissions";
import {
  isDepartmentDashboardRole,
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

interface SourceReportPageProps {
  searchParams: Promise<ReportSearchParams>;
}

export const dynamic = "force-dynamic";

export default async function SourceReportPage({
  searchParams,
}: SourceReportPageProps) {
  await requirePermission(PERMISSIONS.REPORTS);

  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const sourceName = params.name?.trim() || "Unknown";
  const showDepartmentFilter = !isDepartmentDashboardRole(user.role);
  const filters = parseReportFilters(params);
  const filtersActive = hasActiveReportFilters(params);

  const rows = await fetchSourceReport(user, sourceName, filters);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={`${sourceName} Report`}
        description={`Pending DAK originating from ${sourceName}. Filter and export.`}
        icon={Layers}
      />

      <PendingReportFiltersPanel
        basePath="/dashboard/reports/source"
        showDepartmentFilter={showDepartmentFilter}
      />

      {filtersActive && (
        <p className="text-sm text-muted-foreground">
          Filters active ·{" "}
          <Link
            href={`/dashboard/reports/source?name=${encodeURIComponent(sourceName)}`}
            className="text-primary hover:underline"
          >
            Clear filters
          </Link>
        </p>
      )}

      <Card className="border-primary/15">
        <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{sourceName} Pending Entries</CardTitle>
            <CardDescription>
              {rows.length} pending record{rows.length === 1 ? "" : "s"} from this
              source.
            </CardDescription>
          </div>
          <ReportExportButtons
            reportKind="source"
            filterValues={params}
            canExport={
              canExportReports(user.role) &&
              canExportReportKind(user.role, "source")
            }
            rowCount={rows.length}
            sourceName={sourceName}
          />
        </CardHeader>
        <CardContent>
          <PendingReportTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
