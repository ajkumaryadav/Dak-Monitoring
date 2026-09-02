"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
} from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import type { SectionDashboardData } from "@/features/reports/services/dashboard-analytics";

interface SectionStatCardsProps {
  data: SectionDashboardData;
}

export function SectionStatCards({ data }: SectionStatCardsProps) {
  const { stats } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Link href="/dashboard/dak/pending">
        <StatCard
          title="Assigned DAK"
          value={stats.assigned}
          icon={ClipboardList}
          variant="primary"
          description={`${data.sectionName} allocation`}
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
