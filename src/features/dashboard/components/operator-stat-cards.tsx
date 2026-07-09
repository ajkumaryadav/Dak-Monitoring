"use client";

import Link from "next/link";
import { CalendarDays, FileText, RotateCcw, Send } from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import type { OperatorDashboardData } from "@/features/reports/services/dashboard-analytics";

interface OperatorStatCardsProps {
  stats: OperatorDashboardData["stats"];
}

export function OperatorStatCards({ stats }: OperatorStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Link href="/dashboard/dak">
        <StatCard
          title="Today's Registered DAK"
          value={stats.todayEntries}
          icon={FileText}
          variant="primary"
          description="Registered today"
        />
      </Link>
      <Link href="/dashboard/dak">
        <StatCard
          title="This Month's Registered"
          value={stats.monthEntries}
          icon={CalendarDays}
          variant="info"
          description="Registered this month"
        />
      </Link>
      <Link href="/dashboard/dak/assigned">
        <StatCard
          title="Forwarded DAK"
          value={stats.forwarded}
          icon={Send}
          variant="success"
          description="With Collector/ADM for review"
        />
      </Link>
      <Link href="/dashboard/dak">
        <StatCard
          title="Returned for Correction"
          value={stats.returned}
          icon={RotateCcw}
          variant="warning"
          description="Returned to diary for correction"
        />
      </Link>
    </div>
  );
}
