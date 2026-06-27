import Link from "next/link";
import { Building2 } from "lucide-react";

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
import { fetchDepartmentAssignmentReport } from "@/features/reports/services/pending-report";
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

interface DepartmentReportPageProps {
  searchParams: Promise<ReportSearchParams>;
}

export const dynamic = "force-dynamic";

export default async function DepartmentReportPage({
  searchParams,
}: DepartmentReportPageProps) {
  await requirePermission(PERMISSIONS.REPORTS);

  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const showDepartmentFilter = !isDepartmentDashboardRole(user.role);
  const filters = parseReportFilters(params);
  const filtersActive = hasActiveReportFilters(params);

  const rows = await fetchDepartmentAssignmentReport(user, filters);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Department-wise Report"
        description="Pending DAK assigned to external departments — filter and export."
        icon={Building2}
      />

      <PendingReportFiltersPanel
        basePath="/dashboard/reports/departments"
        showDepartmentFilter={showDepartmentFilter}
      />

      {filtersActive && (
        <p className="text-sm text-muted-foreground">
          Filters active ·{" "}
          <Link
            href="/dashboard/reports/departments"
            className="text-primary hover:underline"
          >
            Clear filters
          </Link>
        </p>
      )}

      <Card className="border-primary/15">
        <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Department Pending Entries</CardTitle>
            <CardDescription>
              {rows.length} department-assigned pending record
              {rows.length === 1 ? "" : "s"}.
            </CardDescription>
          </div>
          <ReportExportButtons
            reportKind="department"
            filterValues={params}
            canExport={
              canExportReports(user.role) &&
              canExportReportKind(user.role, "department")
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
