import Link from "next/link";
import { FileCheck2 } from "lucide-react";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { AtrReportTable } from "@/features/remarks/components/atr-report-table";
import { fetchAtrSubmittedReport } from "@/features/remarks/services/atr-report";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AtrSubmittedReportPage() {
  await requirePermission(PERMISSIONS.DAK_VIEW);

  const user = await getSessionUser();
  if (!user) return null;

  const rows = await fetchAtrSubmittedReport(user);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="ATR Submitted Report"
        description="DAK with submitted Action Taken Reports — department compliance tracking."
        icon={FileCheck2}
      />

      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] via-background to-background p-5 shadow-sm">
        <AtrReportTable rows={rows} showAtrStats />
      </div>

      <Link href="/dashboard/reports" className="text-sm text-primary hover:underline">
        ← Back to reports
      </Link>
    </div>
  );
}
