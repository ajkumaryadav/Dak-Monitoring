import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { SlaReportTable } from "@/features/sla/components/sla-report-table";
import { fetchEscalationReport } from "@/features/sla/services/sla-report";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import type { SlaComplianceRow } from "@/features/sla/lib/sla-types";
import { getDefaultSlaDays } from "@/features/sla/lib/sla-constants";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";

export const dynamic = "force-dynamic";

function daysBetween(from: string, to: string): number {
  const start = new Date(`${from.slice(0, 10)}T00:00:00Z`).getTime();
  const end = new Date(`${to.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export default async function EscalationReportPage() {
  await requirePermission(PERMISSIONS.REPORTS);

  const user = await getSessionUser();
  if (!user) return null;

  const rows = await fetchEscalationReport(user);
  const today = getDistrictDateString();

  const tableRows: SlaComplianceRow[] = rows.map((row) => ({
    ...row,
    sla_days_allowed: getDefaultSlaDays(row.priority),
    is_compliant: false,
    days_remaining: row.sla_due_date
      ? daysBetween(today, row.sla_due_date.slice(0, 10))
      : null,
  }));

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Escalation Report"
        description="DAK escalated beyond assigned officer — department head through ADM tiers."
        icon={ShieldAlert}
      />

      <div className="overflow-hidden rounded-2xl border border-red-950/20 bg-gradient-to-br from-red-950/[0.04] via-background to-background p-5 shadow-sm">
        <SlaReportTable rows={tableRows} showEscalation />
      </div>

      <Link href="/dashboard/reports" className="text-sm text-primary hover:underline">
        ← Back to reports
      </Link>
    </div>
  );
}
