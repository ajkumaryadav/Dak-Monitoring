import { Suspense } from "react";

import { DakListFilters } from "@/features/dak/components/dak-list-filters";
import { getAssignmentUnits } from "@/features/dak/services/get-assignment-units";
import { getDepartments } from "@/features/dak/services/get-departments";
import { getDakSources } from "@/features/dak/services/get-dak-sources";

function FiltersSkeleton() {
  return (
    <div className="h-24 animate-pulse rounded-xl border border-border/60 bg-muted/30" />
  );
}

interface DakListFiltersPanelProps {
  basePath: string;
  showDepartmentFilter: boolean;
  statusMode?: "all" | "pending" | "completed";
}

export async function DakListFiltersPanel({
  basePath,
  showDepartmentFilter,
  statusMode = "all",
}: DakListFiltersPanelProps) {
  const [departments, sources, sections] = await Promise.all([
    showDepartmentFilter ? getDepartments() : Promise.resolve([]),
    getDakSources(),
    getAssignmentUnits("section"),
  ]);

  return (
    <Suspense fallback={<FiltersSkeleton />}>
      <DakListFilters
        basePath={basePath}
        departments={departments}
        sources={sources}
        sections={sections}
        showDepartmentFilter={showDepartmentFilter}
        statusMode={statusMode}
      />
    </Suspense>
  );
}
