import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { DakListSearchBar } from "@/features/dak/components/dak-list-search-bar";
import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

interface AssignmentsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AssignmentsPage({
  searchParams,
}: AssignmentsPageProps) {
  await requirePermission(PERMISSIONS.DAK_ASSIGN);

  const { q } = await searchParams;
  const searchTerm = q?.trim() ?? "";

  const dakEntries = await getFilteredDakList("assignments", searchTerm);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={searchTerm ? "Assignments — Search Results" : "Assignments"}
        description={
          searchTerm
            ? `Filtered assignment queue matching "${searchTerm}".`
            : "Received DAK awaiting Collector or ADM department allocation."
        }
        icon={ClipboardList}
      />

      <DakListSearchBar basePath="/dashboard/dak/assignments" />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length}{" "}
        {searchTerm ? "matching" : "DAK"} entr{dakEntries.length === 1 ? "y" : "ies"}
        {!searchTerm && " awaiting assignment"}
        {searchTerm && (
          <>
            {" "}
            ·{" "}
            <Link
              href="/dashboard/dak/assignments"
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
            searchTerm
              ? "No matching DAK awaiting assignment"
              : "No DAK awaiting assignment"
          }
          emptyDescription={
            searchTerm
              ? "Try a different search term within the assignment queue."
              : "All received correspondence has been allocated to departments."
          }
        />
      </div>
    </div>
  );
}
