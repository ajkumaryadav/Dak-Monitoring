import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { DakListFiltersPanel } from "@/features/dak/components/dak-list-filters-panel";
import { DakListSearchBar } from "@/features/dak/components/dak-list-search-bar";
import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import {
  hasActiveListFilters,
  parseDakListParams,
  type DakListSearchParams,
} from "@/features/dak/lib/parse-dak-list-params";
import { getDakListScope } from "@/features/dak/lib/list-scope";
import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

interface AssignedDakPageProps {
  searchParams: Promise<DakListSearchParams>;
}

export const dynamic = "force-dynamic";

export default async function AssignedDakPage({
  searchParams,
}: AssignedDakPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const params = await searchParams;
  const { searchQuery, filters } = parseDakListParams(params);
  const filtersActive = hasActiveListFilters(filters);

  const scope = getDakListScope(user);
  const showDepartmentFilter = !scope.departmentId && !scope.sectionId;

  const dakEntries = await getFilteredDakList(
    "assigned",
    searchQuery,
    scope,
    filters
  );

  const hasQuery = Boolean(searchQuery || filtersActive);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={hasQuery ? "Assigned DAK — Filtered" : "Assigned DAK"}
        description={
          hasQuery
            ? "Allotted correspondence matching your filters."
            : "All DAK currently allotted — assigned, in progress, pending, or completed awaiting closure."
        }
        icon={ClipboardList}
      />

      <DakListSearchBar basePath="/dashboard/dak/assigned" />

      <DakListFiltersPanel
        basePath="/dashboard/dak/assigned"
        showDepartmentFilter={showDepartmentFilter}
        statusMode="pending"
      />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length} {hasQuery ? "matching" : "assigned"} entr
        {dakEntries.length === 1 ? "y" : "ies"}
        {hasQuery && (
          <>
            {" "}
            ·{" "}
            <Link
              href="/dashboard/dak/assigned"
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
            hasQuery ? "No matching assigned DAK" : "No assigned DAK entries"
          }
          emptyDescription={
            hasQuery
              ? "Try different filters or search terms."
              : "Assigned correspondence will appear here after Collector allocation."
          }
        />
      </div>
    </div>
  );
}
