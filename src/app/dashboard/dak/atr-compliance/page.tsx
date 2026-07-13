import { FileCheck2 } from "lucide-react";

import { AtrComplianceTable } from "@/features/dak/components/atr-compliance-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getAtrComplianceReceivedEntries } from "@/features/dak/services/get-atr-compliance-received";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AtrComplianceReceivedPage() {
  await requireRole(["collector", "adm"]);

  const entries = await getAtrComplianceReceivedEntries();

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="ATR / Compliance Received"
        description="DAKs returned from departments with action taken reports or compliance submissions awaiting Collector review."
        icon={FileCheck2}
      />

      <div className="overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.04] via-background to-background shadow-sm">
        <AtrComplianceTable
          entries={entries}
          emptyTitle="No ATR or compliance submissions"
          emptyDescription="When departments submit ATR or compliance, returned DAKs will appear here."
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Open a DAK to review compliance, approve closure, or return for rework.
        New submissions are highlighted until you open them once.
      </p>
    </div>
  );
}
