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
import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

interface AssignmentsPageProps {
  searchParams: Promise<DakListSearchParams>;
}

export const dynamic = "force-dynamic";

export default async function AssignmentsPage({
  searchParams,
}: AssignmentsPageProps) {
  await requirePermission(PERMISSIONS.DAK_ASSIGN);

  const params = await searchParams;
  const { searchQuery, filters } = parseDakListParams(params);
  const filtersActive = hasActiveListFilters(filters);

  const dakEntries = await getFilteredDakList(
    "assignments",
    searchQuery,
    {},
    filters
  );

  const hasQuery = Boolean(searchQuery || filtersActive);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={hasQuery ? "Assignments — Filtered" : "Assignments"}
        description={
          hasQuery
            ? "Received DAK matching your filters."
            : "Received DAK awaiting Collector or ADM department allocation."
        }
        icon={ClipboardList}
      />

      <DakListSearchBar basePath="/dashboard/dak/assignments" />

      <DakListFiltersPanel
        basePath="/dashboard/dak/assignments"
        showDepartmentFilter
        statusMode="pending"
      />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length}{" "}
        {hasQuery ? "matching" : "DAK"} entr{dakEntries.length === 1 ? "y" : "ies"}
        {!hasQuery && " awaiting assignment"}
        {hasQuery && (
          <>
            {" "}
            ·{" "}
            <Link
              href="/dashboard/dak/assignments"
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
            hasQuery
              ? "No matching DAK awaiting assignment"
              : "No DAK awaiting assignment"
          }
          emptyDescription={
            hasQuery
              ? "Try different filters or search terms."
              : "All received correspondence has been allocated to departments."
          }
        />
      </div>
    </div>
  );
}
