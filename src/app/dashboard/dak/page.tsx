import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
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
import { getDakListScope } from "@/features/dak/lib/list-scope";
import {
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

interface AllDakPageProps {
  searchParams: Promise<DakListSearchParams>;
}

export const dynamic = "force-dynamic";

export default async function AllDakPage({ searchParams }: AllDakPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const canCreate = user
    ? hasPermission(user.role, PERMISSIONS.DAK_ENTRY)
    : false;

  const params = await searchParams;
  const { searchQuery, filters } = parseDakListParams(params);
  const filtersActive = hasActiveListFilters(filters);

  const scope = getDakListScope(user);

  const showDepartmentFilter = !scope.departmentId && !scope.sectionId;

  const dakEntries = await getFilteredDakList(
    "all",
    searchQuery,
    scope,
    filters
  );

  const hasQuery = Boolean(searchQuery || filtersActive);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={hasQuery ? "Search Results" : "All DAK"}
        description={
          hasQuery
            ? "Filtered registered correspondence entries."
            : "View and manage registered district correspondence entries."
        }
        icon={FileText}
      />

      <DakListSearchBar basePath="/dashboard/dak" />

      <DakListFiltersPanel
        basePath="/dashboard/dak"
        showDepartmentFilter={showDepartmentFilter}
        statusMode="all"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {dakEntries.length} {hasQuery ? "matching" : "registered"} entr
          {dakEntries.length === 1 ? "y" : "ies"}
          {hasQuery && (
            <>
              {" "}
              ·{" "}
              <Link href="/dashboard/dak" className="text-primary hover:underline">
                Clear filters
              </Link>
            </>
          )}
        </p>
        {canCreate && (
          <Link
            href="/dashboard/dak/new"
            className={cn(buttonVariants(), "h-9 gap-1.5 px-4")}
          >
            <Plus className="size-4" />
            Register DAK
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
        <DakListTable
          entries={dakEntries}
          emptyTitle={hasQuery ? "No matching DAK entries" : "No DAK entries yet"}
          emptyDescription={
            hasQuery
              ? "Try different filters or search terms."
              : "Register the first correspondence to begin tracking."
          }
          showRegisterAction={canCreate && !hasQuery}
        />
      </div>
    </div>
  );
}
