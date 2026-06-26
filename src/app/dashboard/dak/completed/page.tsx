import { CheckCircle2 } from "lucide-react";

import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getDakList } from "@/features/dak/services/get-dak-stats";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export default async function CompletedDakPage() {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const dakEntries = await getDakList("completed");

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Completed DAK"
        description="Disposed and closed correspondence records."
        icon={CheckCircle2}
      />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length} completed entr
        {dakEntries.length === 1 ? "y" : "ies"}
      </p>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
        <DakListTable
          entries={dakEntries}
          emptyTitle="No completed DAK entries"
          emptyDescription="Completed and disposed items will appear here."
        />
      </div>
    </div>
  );
}
