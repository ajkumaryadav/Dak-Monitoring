import { Clock } from "lucide-react";

import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getDakList } from "@/features/dak/services/get-dak-stats";
import { isDepartmentDashboardRole, PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export default async function PendingDakPage() {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  const departmentId =
    user && isDepartmentDashboardRole(user.role) ? user.departmentId : undefined;

  const dakEntries = await getDakList("pending", departmentId);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Pending DAK"
        description="Active correspondence awaiting assignment, processing, or review."
        icon={Clock}
      />

      <p className="text-sm text-muted-foreground">
        {dakEntries.length} active entr{dakEntries.length === 1 ? "y" : "ies"}
      </p>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
        <DakListTable
          entries={dakEntries}
          emptyTitle="No pending DAK entries"
          emptyDescription="All registered correspondence has been completed or disposed."
        />
      </div>
    </div>
  );
}
