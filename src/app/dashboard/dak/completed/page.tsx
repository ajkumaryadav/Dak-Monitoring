import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { DakListSearchBar } from "@/features/dak/components/dak-list-search-bar";
import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import {
  isDepartmentDashboardRole,
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

interface CompletedDakPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const dynamic = "force-dynamic";

export default async function CompletedDakPage({
  searchParams,
}: CompletedDakPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const { q } = await searchParams;
  const searchTerm = q?.trim() ?? "";

  const departmentId =
    user && isDepartmentDashboardRole(user.role) ? user.departmentId : undefined;

  const dakEntries = await getFilteredDakList(
    "completed",
    searchTerm,
    departmentId
  );

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={searchTerm ? "Completed DAK — Search Results" : "Completed DAK"}
        description={
          searchTerm
            ? `Filtered completed items matching "${searchTerm}".`
            : "Disposed and closed correspondence records."
        }
        icon={CheckCircle2}
      />

      <DakListSearchBar basePath="/dashboard/dak/completed" />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length} {searchTerm ? "matching" : "completed"} entr
        {dakEntries.length === 1 ? "y" : "ies"}
        {searchTerm && (
          <>
            {" "}
            ·{" "}
            <Link
              href="/dashboard/dak/completed"
              className="text-primary hover:underline"
            >
              Clear search
            </Link>
          </>
        )}
      </p>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
        <DakListTable
          entries={dakEntries}
          emptyTitle={
            searchTerm ? "No matching completed DAK" : "No completed DAK entries"
          }
          emptyDescription={
            searchTerm
              ? "Try a different search term within completed items."
              : "Completed and disposed items will appear here."
          }
        />
      </div>
    </div>
  );
}
