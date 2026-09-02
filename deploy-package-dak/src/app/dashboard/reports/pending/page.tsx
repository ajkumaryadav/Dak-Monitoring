import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";

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
import { fetchPendingReport } from "@/features/reports/services/pending-report";
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

interface PendingReportPageProps {
  searchParams: Promise<ReportSearchParams>;
}

export const dynamic = "force-dynamic";

export default async function PendingReportPage({
  searchParams,
}: PendingReportPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const showDepartmentFilter = !isDepartmentDashboardRole(user.role);
  const filters = parseReportFilters(params);
  const filtersActive = hasActiveReportFilters(params);
  const isOverdueView = filters.overdueOnly;
  const reportKind = isOverdueView ? "overdue" : "pending";

  const rows = await fetchPendingReport(user, filters);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={isOverdueView ? "Overdue Report" : "Pending Report"}
        description={
          isOverdueView
            ? "Active DAK past due date — filter by source, department, section, status, and date."
            : "All pending workflow DAK — filter by source, department, section, priority, status, and date."
        }
        icon={isOverdueView ? AlertTriangle : Clock}
      />

      <PendingReportFiltersPanel
        basePath="/dashboard/reports/pending"
        showDepartmentFilter={showDepartmentFilter}
      />

      {filtersActive && (
        <p className="text-sm text-muted-foreground">
          Filters active ·{" "}
          <Link
            href="/dashboard/reports/pending"
            className="text-primary hover:underline"
          >
            Clear filters
          </Link>
        </p>
      )}

      <Card className="border-primary/15">
        <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>
              {isOverdueView ? "Overdue DAK Entries" : "Pending DAK Entries"}
            </CardTitle>
            <CardDescription>
              {rows.length} record{rows.length === 1 ? "" : "s"} matching filters.
            </CardDescription>
          </div>
          <ReportExportButtons
            reportKind={reportKind}
            filterValues={params}
            canExport={
              canExportReports(user.role) &&
              canExportReportKind(user.role, reportKind)
            }
            rowCount={rows.length}
          />
        </CardHeader>
        <CardContent>
          <PendingReportTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
