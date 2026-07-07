import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";

import { getLoginShowcaseStats } from "@/features/auth/services/get-login-showcase-stats";
import { SimpleBarChart } from "@/features/reports/charts/simple-charts";
import { SimpleStatusChart } from "@/features/reports/charts/simple-charts";
import { StatCard } from "@/features/dashboard/components/stat-card";

/** Demo dashboard preview on the login page — illustrative data only. */
export function AuthShowcasePreview() {
  const { stats, statusChart, monthlyTrend, departmentRates } =
    getLoginShowcaseStats();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Dashboard Preview
        </p>
        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Sample Data
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Total DAK"
          value={stats.totalDak}
          icon={FileText}
          variant="primary"
          className="p-4 [&_p.text-3xl]:text-2xl"
        />
        <StatCard
          title="Pending DAK"
          value={stats.pendingDak}
          icon={Clock}
          variant="info"
          className="p-4 [&_p.text-3xl]:text-2xl"
        />
        <StatCard
          title="Completed DAK"
          value={stats.completedDak}
          icon={CheckCircle2}
          variant="success"
          className="p-4 [&_p.text-3xl]:text-2xl"
        />
        <StatCard
          title="Overdue DAK"
          value={stats.overdueDak}
          icon={AlertTriangle}
          variant="warning"
          className="p-4 [&_p.text-3xl]:text-2xl"
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Monthly DAK Trend</p>
        </div>
        <SimpleBarChart
          data={monthlyTrend}
          barClassName="bg-primary"
          emptyMessage="No trend data."
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
          <p className="mb-3 text-sm font-semibold text-foreground">
            DAK Status Distribution
          </p>
          <SimpleStatusChart data={statusChart} />
        </div>
        <div className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Department Disposal Rate (%)
          </p>
          <SimpleBarChart
            data={departmentRates}
            barClassName="bg-emerald-600"
            emptyMessage="No department data."
          />
        </div>
      </div>
    </div>
  );
}
