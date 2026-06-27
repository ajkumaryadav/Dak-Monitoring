"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  Clock,
  FileText,
  Flame,
  Landmark,
  Scale,
  Users,
} from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import { DAK_SOURCE_WIDGETS } from "@/lib/constants/dak-sources";
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
    <div className="space-y-4">
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
            title="Pending DAK"
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
        <Link href="/dashboard/reports/pending?overdue=1">
          <StatCard
            title="Overdue DAK"
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
        <Link href="/dashboard/reports/pending">
          <StatCard
            title="Department Pending"
            value={stats.departmentPending}
            icon={Building2}
            variant="primary"
            description="Pending at department level"
          />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.CMO)}`}
        >
          <StatCard
            title="CMO DAK"
            value={stats.cmoDak}
            icon={Landmark}
            variant="danger"
            description="Pending CMO references"
          />
        </Link>
        <Link
          href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.JAN_SUNWAI)}`}
        >
          <StatCard
            title="Jan Sunwai DAK"
            value={stats.janSunwaiDak}
            icon={Users}
            variant="info"
            description="Public hearing references"
          />
        </Link>
        <Link
          href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.MLA)}`}
        >
          <StatCard
            title="MLA References"
            value={stats.mlaReferences}
            icon={Flame}
            variant="warning"
            description="MLA pending correspondence"
          />
        </Link>
        <Link
          href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.CHIEF_SECRETARY)}`}
        >
          <StatCard
            title="Chief Secretary Refs"
            value={stats.chiefSecretaryRefs}
            icon={FileText}
            variant="primary"
            description="CS office pending items"
          />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.COURT)}`}
        >
          <StatCard
            title="Court Cases"
            value={stats.courtCases}
            icon={Scale}
            variant="danger"
            description="Court-related pending DAK"
          />
        </Link>
        <Link href="/dashboard/reports/sections">
          <StatCard
            title="Internal Section Pending"
            value={stats.internalSectionPending}
            icon={Building2}
            variant="info"
            description="Collectorate section workload"
          />
        </Link>
        <Link href="/dashboard/dak/pending">
          <StatCard
            title="High Priority"
            value={stats.highPriority}
            icon={Flame}
            variant="warning"
            trend={{
              label: pct(stats.highPriority, stats.pending || 1),
              direction: stats.highPriority > 0 ? "up" : "neutral",
            }}
            description="Urgent or immediate items"
          />
        </Link>
      </div>
    </div>
  );
}
