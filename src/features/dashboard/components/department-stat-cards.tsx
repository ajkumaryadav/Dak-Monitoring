"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
} from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import type { DepartmentDashboardData } from "@/features/reports/services/dashboard-analytics";

interface DepartmentStatCardsProps {
  data: DepartmentDashboardData;
}

export function DepartmentStatCards({ data }: DepartmentStatCardsProps) {
  const { stats } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Link href="/dashboard/dak/assigned">
        <StatCard
          title="Assigned DAK"
          value={stats.assigned}
          icon={ClipboardList}
          variant="primary"
          description={`${data.departmentName} allocation`}
        />
      </Link>
      <Link href="/dashboard/dak/pending">
        <StatCard
          title="Pending DAK"
          value={stats.pendingActions}
          icon={Clock}
          variant="info"
          trend={{
            label: stats.pendingActions > 0 ? "Action required" : "Clear",
            direction: stats.pendingActions > 0 ? "up" : "neutral",
          }}
        />
      </Link>
      <Link href="/dashboard/reports/pending">
        <StatCard
          title="Overdue DAK"
          value={stats.overdue}
          icon={AlertTriangle}
          variant="warning"
          trend={{
            label: stats.overdue > 0 ? "Escalation ready" : "On schedule",
            direction: stats.overdue > 0 ? "down" : "up",
          }}
        />
      </Link>
      <Link href="/dashboard/dak/completed">
        <StatCard
          title="Completed DAK"
          value={stats.completed}
          icon={CheckCircle2}
          variant="success"
        />
      </Link>
    </div>
  );
}
