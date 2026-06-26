import { Building2, Clock, FileText, Flame } from "lucide-react";

import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { SimpleDepartmentChart } from "@/features/reports/charts/simple-department-chart";
import {
  SimplePriorityChart,
  SimpleStatusChart,
} from "@/features/reports/charts/simple-charts";
import { RecentDakTable } from "@/features/reports/components/recent-dak-table";
import type {
  ChartCountRow,
  DepartmentPerformanceRow,
  RecentDakRow,
} from "@/features/reports/services/dashboard-analytics";

interface DashboardChartsPanelProps {
  priorityChart: ChartCountRow[];
  statusChart: ChartCountRow[];
  recentDak: RecentDakRow[];
  departmentPerformance?: DepartmentPerformanceRow[];
  recentTitle?: string;
  recentDescription?: string;
}

/** Server-rendered dashboard charts — avoids client serialization issues. */
export function DashboardChartsPanel({
  priorityChart,
  statusChart,
  recentDak,
  departmentPerformance,
  recentTitle = "Recent DAK",
  recentDescription = "Latest registered correspondence",
}: DashboardChartsPanelProps) {
  return (
    <>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <DashboardSection
          title="Priority Distribution"
          description="Active DAK by priority level"
          icon={Flame}
          variant="primary"
        >
          <SimplePriorityChart data={priorityChart} />
        </DashboardSection>

        <DashboardSection
          title="Status Pipeline"
          description="Current workflow status breakdown"
          icon={Clock}
          variant="neutral"
        >
          <SimpleStatusChart data={statusChart} />
        </DashboardSection>
      </div>

      <DashboardSection
        title={recentTitle}
        description={recentDescription}
        icon={FileText}
        variant="primary"
      >
        <RecentDakTable rows={recentDak} />
      </DashboardSection>

      {departmentPerformance && (
        <DashboardSection
          title="Department Performance"
          description="Pending, overdue, and completed cases by department"
          icon={Building2}
          variant="neutral"
        >
          <SimpleDepartmentChart data={departmentPerformance} />
        </DashboardSection>
      )}
    </>
  );
}
