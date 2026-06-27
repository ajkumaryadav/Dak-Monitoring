"use client";

import Link from "next/link";
import { FileText, RotateCcw, Sun } from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import type { OperatorDashboardData } from "@/features/reports/services/dashboard-analytics";

interface OperatorStatCardsProps {
  stats: OperatorDashboardData["stats"];
}

export function OperatorStatCards({ stats }: OperatorStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Link href="/dashboard/dak">
        <StatCard
          title="My Registered DAK"
          value={stats.registered}
          icon={FileText}
          variant="primary"
          description="Entries you have registered"
        />
      </Link>
      <Link href="/dashboard/dak">
        <StatCard
          title="Today's Entries"
          value={stats.todayEntries}
          icon={Sun}
          variant="info"
          description="Registered today"
        />
      </Link>
      <Link href="/dashboard/dak/pending">
        <StatCard
          title="Returned DAK"
          value={stats.returned}
          icon={RotateCcw}
          variant="warning"
          description="Awaiting assignment or returned to diary"
        />
      </Link>
    </div>
  );
}
