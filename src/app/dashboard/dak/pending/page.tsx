import Link from "next/link";
import { Clock } from "lucide-react";

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

interface PendingDakPageProps {
  searchParams: Promise<DakListSearchParams>;
}

export const dynamic = "force-dynamic";

export default async function PendingDakPage({
  searchParams,
}: PendingDakPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const params = await searchParams;
  const { searchQuery, filters } = parseDakListParams(params);
  const filtersActive = hasActiveListFilters(filters);

  const departmentId =
    user && isDepartmentDashboardRole(user.role) ? user.departmentId : undefined;

  const showDepartmentFilter = !isDepartmentDashboardRole(user?.role ?? "dak_operator");

  const dakEntries = await getFilteredDakList(
    "pending",
    searchQuery,
    departmentId,
    filters
  );

  const hasQuery = Boolean(searchQuery || filtersActive);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={hasQuery ? "Pending DAK — Filtered" : "Pending DAK"}
        description={
          hasQuery
            ? "Active correspondence matching your filters."
            : "Active correspondence awaiting assignment, processing, or review."
        }
        icon={Clock}
      />

      <DakListSearchBar basePath="/dashboard/dak/pending" />

      <DakListFiltersPanel
        basePath="/dashboard/dak/pending"
        showDepartmentFilter={showDepartmentFilter}
        statusMode="pending"
      />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length} {hasQuery ? "matching" : "active"} entr
        {dakEntries.length === 1 ? "y" : "ies"}
        {hasQuery && (
          <>
            {" "}
            ·{" "}
            <Link
              href="/dashboard/dak/pending"
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
            hasQuery ? "No matching pending DAK" : "No pending DAK entries"
          }
          emptyDescription={
            hasQuery
              ? "Try different filters or search terms."
              : "All registered correspondence has been completed or disposed."
          }
        />
      </div>
    </div>
  );
}
