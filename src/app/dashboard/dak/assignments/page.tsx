import { ClipboardList } from "lucide-react";

import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getDakList } from "@/features/dak/services/get-dak-stats";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export default async function AssignmentsPage() {
  await requirePermission(PERMISSIONS.DAK_ASSIGN);

  const dakEntries = await getDakList("assignments");

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Assignments"
        description="Received DAK awaiting Collector or ADM department allocation."
        icon={ClipboardList}
      />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length} DAK entr{dakEntries.length === 1 ? "y" : "ies"}{" "}
        awaiting assignment
      </p>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
        <DakListTable
          entries={dakEntries}
          emptyTitle="No DAK awaiting assignment"
          emptyDescription="All received correspondence has been allocated to departments."
        />
      </div>
    </div>
  );
}
