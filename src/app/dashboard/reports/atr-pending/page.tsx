import Link from "next/link";
import { FileText } from "lucide-react";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { AtrReportTable } from "@/features/remarks/components/atr-report-table";
import { fetchAtrPendingReport } from "@/features/remarks/services/atr-report";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AtrPendingReportPage() {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  if (!user) return null;

  const rows = await fetchAtrPendingReport(user);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="ATR Pending Report"
        description="Assigned active DAK awaiting Action Taken Report submission."
        icon={FileText}
      />

      <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] via-background to-background p-5 shadow-sm">
        <AtrReportTable rows={rows} />
      </div>

      <Link href="/dashboard/reports" className="text-sm text-primary hover:underline">
        ← Back to reports
      </Link>
    </div>
  );
}
