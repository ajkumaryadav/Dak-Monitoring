import { Suspense } from "react";
import { AlertTriangle, Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getAssignmentUnits } from "@/features/dak/services/get-assignment-units";
import { getDepartments } from "@/features/dak/services/get-departments";
import { getDakSources } from "@/features/dak/services/get-dak-sources";
import { PendingReportFilters } from "@/features/reports/components/pending-report-filters";
import { PendingReportTable } from "@/features/reports/components/pending-report-table";
import { fetchPendingReport } from "@/features/reports/services/pending-report";
import {
  isDepartmentDashboardRole,
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import type { DakStatus, PriorityLevel } from "@/types";

interface PendingReportPageProps {
  searchParams: Promise<{
    department?: string;
    source?: string;
    section?: string;
    priority?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    overdue?: string;
  }>;
}

function FiltersSkeleton() {
  return (
    <div className="h-24 animate-pulse rounded-xl border border-border/60 bg-muted/30" />
  );
}

export default async function PendingReportPage({
  searchParams,
}: PendingReportPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const showDepartmentFilter = !isDepartmentDashboardRole(user.role);

  const filters = {
    departmentId: params.department,
    sourceId: params.source,
    assignmentUnitId: params.section,
    priority: (params.priority ?? "") as PriorityLevel | "",
    status: (params.status ?? "") as DakStatus | "",
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    overdueOnly: params.overdue === "1",
  };

  const [rows, departments, sources, sections] = await Promise.all([
    fetchPendingReport(user, filters),
    showDepartmentFilter ? getDepartments() : Promise.resolve([]),
    getDakSources(),
    getAssignmentUnits("section"),
  ]);

  const isOverdueView = filters.overdueOnly;

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

      <Suspense fallback={<FiltersSkeleton />}>
        <PendingReportFilters
          departments={departments}
          sources={sources}
          sections={sections}
          showDepartmentFilter={showDepartmentFilter}
        />
      </Suspense>

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>
            {isOverdueView ? "Overdue DAK Entries" : "Pending DAK Entries"}
          </CardTitle>
          <CardDescription>
            {rows.length} record{rows.length === 1 ? "" : "s"} matching filters.
            Excel and PDF export will be added in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingReportTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
