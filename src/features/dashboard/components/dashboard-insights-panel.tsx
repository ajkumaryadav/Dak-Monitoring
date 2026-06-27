import Link from "next/link";
import {
  CheckCircle2,
  GitBranch,
  Layers,
  Mail,
  MessageSquare,
  Percent,
  Users,
} from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import type {
  ChartCountRow,
  DashboardStatSummary,
} from "@/features/reports/services/dashboard-analytics";

interface DashboardInsightsPanelProps {
  stats: DashboardStatSummary;
  sourceChart: ChartCountRow[];
}

function sourceCount(sourceChart: ChartCountRow[], label: string): number {
  return sourceChart.find((row) => row.label === label)?.value ?? 0;
}

function completionRate(completed: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((completed / total) * 100)}%`;
}

export function DashboardInsightsPanel({
  stats,
  sourceChart,
}: DashboardInsightsPanelProps) {
  const publicGrievance = sourceCount(sourceChart, "Public Grievance");
  const cmHelpline = sourceCount(sourceChart, "CM Helpline");
  const emailSource = sourceCount(sourceChart, "Email");
  const ratriChaupal = sourceCount(sourceChart, "Ratri Chaupal");

  return (
    <DashboardSection
      title="Insights & Analytics"
      description="Additional district correspondence metrics and source trends"
      icon={Layers}
      variant="primary"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/dashboard/dak/completed">
          <StatCard
            title="Completed DAK"
            value={stats.completed}
            icon={CheckCircle2}
            variant="success"
            trend={{
              label: completionRate(stats.completed, stats.total),
              direction: stats.completed > 0 ? "up" : "neutral",
            }}
            description="Disposed and closed correspondence"
          />
        </Link>

        <Link href="/dashboard/dak/pending">
          <StatCard
            title="Completion Rate"
            value={completionRate(stats.completed, stats.total)}
            icon={Percent}
            variant="primary"
            description={`${stats.completed} of ${stats.total} total DAK`}
          />
        </Link>

        <Link href="/dashboard/dak/pending?priority=urgent">
          <StatCard
            title="High Priority Queue"
            value={stats.highPriority}
            icon={GitBranch}
            variant="warning"
            description="Urgent and immediate pending items"
          />
        </Link>

        <Link href="/dashboard/reports/sections">
          <StatCard
            title="Section Assignments"
            value={stats.internalSectionPending}
            icon={Layers}
            variant="info"
            description="Pending at internal Collectorate sections"
          />
        </Link>

        <Link href="/dashboard/reports/pending">
          <StatCard
            title="Public Grievance"
            value={publicGrievance}
            icon={MessageSquare}
            variant="info"
            description="Pending public grievance DAK"
          />
        </Link>

        <Link href="/dashboard/reports/pending">
          <StatCard
            title="CM Helpline"
            value={cmHelpline}
            icon={Users}
            variant="primary"
            description="Pending CM helpline references"
          />
        </Link>

        <Link href="/dashboard/reports/pending">
          <StatCard
            title="Email / Digital"
            value={emailSource}
            icon={Mail}
            variant="info"
            description="Pending email-origin correspondence"
          />
        </Link>

        <Link href="/dashboard/reports/pending">
          <StatCard
            title="Ratri Chaupal"
            value={ratriChaupal}
            icon={Users}
            variant="success"
            description="Pending Ratri Chaupal references"
          />
        </Link>
      </div>
    </DashboardSection>
  );
}
