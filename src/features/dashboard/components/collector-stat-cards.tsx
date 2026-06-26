"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  FileText,
  Flame,
} from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import type { CollectorDashboardData } from "@/features/reports/services/dashboard-analytics";

interface CollectorStatCardsProps {
  stats: CollectorDashboardData["stats"];
}

function pct(part: number, total: number) {
  if (!total) return "0% of total";
  return `${Math.round((part / total) * 100)}% of total`;
}

export function CollectorStatCards({ stats }: CollectorStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Link href="/dashboard/dak">
        <StatCard
          title="Total DAK"
          value={stats.total}
          icon={FileText}
          variant="primary"
          trend={{ label: pct(stats.total, stats.total), direction: "neutral" }}
          description="All registered correspondence"
        />
      </Link>
      <Link href="/dashboard/dak/pending">
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          variant="info"
          trend={{
            label: pct(stats.pending, stats.total),
            direction: stats.pending > 0 ? "up" : "neutral",
          }}
          description="Awaiting workflow action"
        />
      </Link>
      <Link href="/dashboard/reports/pending">
        <StatCard
          title="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          variant="warning"
          trend={{
            label: stats.overdue > 0 ? "Needs attention" : "On track",
            direction: stats.overdue > 0 ? "down" : "up",
          }}
          description="Past due date, not completed"
        />
      </Link>
      <Link href="/dashboard/dak/pending">
        <StatCard
          title="High Priority"
          value={stats.highPriority}
          icon={Flame}
          variant="danger"
          trend={{
            label: pct(stats.highPriority, stats.pending || 1),
            direction: stats.highPriority > 0 ? "up" : "neutral",
          }}
          description="Urgent or immediate items"
        />
      </Link>
    </div>
  );
}
