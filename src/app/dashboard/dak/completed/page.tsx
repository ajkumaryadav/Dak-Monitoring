import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { DakListFiltersPanel } from "@/features/dak/components/dak-list-filters-panel";
import { DakListSearchBar } from "@/features/dak/components/dak-list-search-bar";
import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import {
  hasActiveListFilters,
  parseDakListParams,
  type DakListSearchParams,
} from "@/features/dak/lib/parse-dak-list-params";
import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import {
  isDepartmentDashboardRole,
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

interface CompletedDakPageProps {
  searchParams: Promise<DakListSearchParams>;
}

export const dynamic = "force-dynamic";

export default async function CompletedDakPage({
  searchParams,
}: CompletedDakPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const params = await searchParams;
  const { searchQuery, filters } = parseDakListParams(params);
  const filtersActive = hasActiveListFilters(filters);

  const departmentId =
    user && isDepartmentDashboardRole(user.role) ? user.departmentId : undefined;

  const showDepartmentFilter = !isDepartmentDashboardRole(user?.role ?? "clerk");

  const dakEntries = await getFilteredDakList(
    "completed",
    searchQuery,
    departmentId,
    filters
  );

  const hasQuery = Boolean(searchQuery || filtersActive);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={hasQuery ? "Completed DAK — Filtered" : "Completed DAK"}
        description={
          hasQuery
            ? "Completed items matching your filters."
            : "Disposed and closed correspondence records."
        }
        icon={CheckCircle2}
      />

      <DakListSearchBar basePath="/dashboard/dak/completed" />

      <DakListFiltersPanel
        basePath="/dashboard/dak/completed"
        showDepartmentFilter={showDepartmentFilter}
        statusMode="completed"
      />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length} {hasQuery ? "matching" : "completed"} entr
        {dakEntries.length === 1 ? "y" : "ies"}
        {hasQuery && (
          <>
            {" "}
            ·{" "}
            <Link
              href="/dashboard/dak/completed"
              className="text-primary hover:underline"
            >
              Clear filters
            </Link>
          </>
        )}
      </p>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
        <DakListTable
          entries={dakEntries}
          emptyTitle={
            hasQuery ? "No matching completed DAK" : "No completed DAK entries"
          }
          emptyDescription={
            hasQuery
              ? "Try different filters or search terms."
              : "Completed and disposed items will appear here."
          }
        />
      </div>
    </div>
  );
}
