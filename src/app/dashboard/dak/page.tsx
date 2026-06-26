import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DakListSearchBar } from "@/features/dak/components/dak-list-search-bar";
import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import {
  isDepartmentDashboardRole,
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

interface AllDakPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AllDakPage({ searchParams }: AllDakPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const canCreate = user
    ? hasPermission(user.role, PERMISSIONS.DAK_ENTRY)
    : false;

  const { q } = await searchParams;
  const searchTerm = q?.trim() ?? "";

  const departmentId =
    user && isDepartmentDashboardRole(user.role) ? user.departmentId : undefined;

  const dakEntries = await getFilteredDakList("all", searchTerm, departmentId);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={searchTerm ? "Search Results" : "All DAK"}
        description={
          searchTerm
            ? `Showing matches for "${searchTerm}".`
            : "View and manage registered district correspondence entries."
        }
        icon={FileText}
      />

      <DakListSearchBar basePath="/dashboard/dak" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {dakEntries.length} {searchTerm ? "matching" : "registered"} entr
          {dakEntries.length === 1 ? "y" : "ies"}
          {searchTerm && (
            <>
              {" "}
              ·{" "}
              <Link href="/dashboard/dak" className="text-primary hover:underline">
                Clear search
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
          emptyTitle={searchTerm ? "No matching DAK entries" : "No DAK entries yet"}
          emptyDescription={
            searchTerm
              ? "Try a different DAK number, subject, sender, or department name."
              : "Register the first correspondence to begin tracking."
          }
          showRegisterAction={canCreate && !searchTerm}
        />
      </div>
    </div>
  );
}
