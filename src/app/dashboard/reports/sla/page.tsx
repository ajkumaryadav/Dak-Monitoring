import Link from "next/link";
import { Gauge } from "lucide-react";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { SlaReportTable } from "@/features/sla/components/sla-report-table";
import { fetchSlaComplianceReport } from "@/features/sla/services/sla-report";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

interface SlaReportPageProps {
  searchParams: Promise<{ dueToday?: string; dueSoon?: string }>;
}

export default async function SlaReportPage({ searchParams }: SlaReportPageProps) {
  await requirePermission(PERMISSIONS.REPORTS);

  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const dueTodayOnly = params.dueToday === "1";
  const dueSoonOnly = params.dueSoon === "1";

  const rows = await fetchSlaComplianceReport(user, {
    dueTodayOnly,
    dueSoonOnly,
  });

  const title = dueTodayOnly
    ? "Due Today Report"
    : dueSoonOnly
      ? "Due Soon Report"
      : "SLA Compliance Report";

  const description = dueTodayOnly
    ? "Active DAK with SLA expiring today."
    : dueSoonOnly
      ? "Active DAK with SLA due tomorrow."
      : "Active DAK SLA status — compliant, due soon, overdue, and escalated.";

  return (
    <div className="space-y-6">
      <DakPageHeader title={title} description={description} icon={Gauge} />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/reports/sla"
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/50"
        >
          All active
        </Link>
        <Link
          href="/dashboard/reports/sla?dueToday=1"
          className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-sm hover:bg-amber-500/10"
        >
          Due today
        </Link>
        <Link
          href="/dashboard/reports/sla?dueSoon=1"
          className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-sm hover:bg-amber-500/10"
        >
          Due tomorrow
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.03] via-background to-background p-5 shadow-sm">
        <SlaReportTable rows={rows} showEscalation />
      </div>

      <Link href="/dashboard/reports" className="text-sm text-primary hover:underline">
        ← Back to reports
      </Link>
    </div>
  );
}
