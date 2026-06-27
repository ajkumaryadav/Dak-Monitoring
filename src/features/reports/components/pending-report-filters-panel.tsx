import { Suspense } from "react";

import { PendingReportFilters } from "@/features/reports/components/pending-report-filters";
import { getAssignmentUnits } from "@/features/dak/services/get-assignment-units";
import { getDepartments } from "@/features/dak/services/get-departments";
import { getDakSources } from "@/features/dak/services/get-dak-sources";

function FiltersSkeleton() {
  return (
    <div className="h-24 animate-pulse rounded-xl border border-border/60 bg-muted/30" />
  );
}

interface PendingReportFiltersPanelProps {
  basePath: string;
  showDepartmentFilter: boolean;
}

/** Server wrapper that loads filter options and mounts client filters. */
export async function PendingReportFiltersPanel({
  basePath,
  showDepartmentFilter,
}: PendingReportFiltersPanelProps) {
  const [departments, sources, sections] = await Promise.all([
    showDepartmentFilter ? getDepartments() : Promise.resolve([]),
    getDakSources(),
    getAssignmentUnits("section"),
  ]);

  return (
    <Suspense fallback={<FiltersSkeleton />}>
      <PendingReportFilters
        basePath={basePath}
        departments={departments}
        sources={sources}
        sections={sections}
        showDepartmentFilter={showDepartmentFilter}
      />
    </Suspense>
  );
}
