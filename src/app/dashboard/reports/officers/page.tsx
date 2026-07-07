import { Users } from "lucide-react";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { fetchOfficerPerformance } from "@/features/reports/services/dashboard-analytics";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OfficersReportPage() {
  await requirePermission(PERMISSIONS.REPORTS);
  const rows = await fetchOfficerPerformance();

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Officer Performance"
        description="Officer-wise pending, overdue, completed counts, and average disposal time."
        icon={Users}
      />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Officer</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Overdue</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Avg Disposal (days)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.officer_id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{row.officer_name}</td>
                <td className="px-4 py-3">{row.department_name}</td>
                <td className="px-4 py-3">{row.pending}</td>
                <td className="px-4 py-3">{row.overdue}</td>
                <td className="px-4 py-3">{row.completed}</td>
                <td className="px-4 py-3">{row.avg_disposal_days ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No officer assignment data yet.
          </p>
        )}
      </div>
    </div>
  );
}
