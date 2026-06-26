import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getDakList } from "@/features/dak/services/get-dak-stats";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function AllDakPage() {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const canCreate = user
    ? hasPermission(user.role, PERMISSIONS.DAK_ENTRY)
    : false;

  const dakEntries = await getDakList("all");

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="All DAK"
        description="View and manage registered district correspondence entries."
        icon={FileText}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {dakEntries.length} registered entr
          {dakEntries.length === 1 ? "y" : "ies"}
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
          emptyTitle="No DAK entries yet"
          emptyDescription="Register the first correspondence to begin tracking."
          showRegisterAction={canCreate}
        />
      </div>
    </div>
  );
}
