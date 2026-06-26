import Link from "next/link";
import { Clock } from "lucide-react";

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

interface PendingDakPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const dynamic = "force-dynamic";

export default async function PendingDakPage({
  searchParams,
}: PendingDakPageProps) {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const { q } = await searchParams;
  const searchTerm = q?.trim() ?? "";

  const departmentId =
    user && isDepartmentDashboardRole(user.role) ? user.departmentId : undefined;

  const dakEntries = await getFilteredDakList(
    "pending",
    searchTerm,
    departmentId
  );

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={searchTerm ? "Pending DAK — Search Results" : "Pending DAK"}
        description={
          searchTerm
            ? `Filtered pending items matching "${searchTerm}".`
            : "Active correspondence awaiting assignment, processing, or review."
        }
        icon={Clock}
      />

      <DakListSearchBar basePath="/dashboard/dak/pending" />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length} {searchTerm ? "matching" : "active"} entr
        {dakEntries.length === 1 ? "y" : "ies"}
        {searchTerm && (
          <>
            {" "}
            ·{" "}
            <Link
              href="/dashboard/dak/pending"
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
            searchTerm ? "No matching pending DAK" : "No pending DAK entries"
          }
          emptyDescription={
            searchTerm
              ? "Try a different search term within pending items."
              : "All registered correspondence has been completed or disposed."
          }
        />
      </div>
    </div>
  );
}
