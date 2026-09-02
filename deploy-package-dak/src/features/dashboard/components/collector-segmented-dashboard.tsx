"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Landmark,
  Layers,
  ListChecks,
  Percent,
  Scale,
  Users,
} from "lucide-react";

import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { PendingDepartmentsTable } from "@/features/dashboard/components/pending-departments-table";
import { PendingSectionsTable } from "@/features/dashboard/components/pending-sections-table";
import { DAK_SOURCE_WIDGETS } from "@/lib/constants/dak-sources";
import type { CollectorDashboardData } from "@/features/reports/services/dashboard-analytics";

interface CollectorSegmentedDashboardProps {
  analytics: CollectorDashboardData;
}

/** Segmented collector dashboard — category-wise stat groups with distinct colors. */
export function CollectorSegmentedDashboard({
  analytics,
}: CollectorSegmentedDashboardProps) {
  const { stats, pendingDepartments, pendingSections } = analytics;

  return (
    <div className="space-y-6">
      <DashboardSection
        title="DAK Overview"
        description="Core correspondence volume and workflow status"
        icon={FileText}
        variant="blue"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/dashboard/dak">
            <StatCard
              title="Total DAK"
              value={stats.total}
              icon={FileText}
              variant="info"
              description="All registered correspondence"
            />
          </Link>
          <Link href="/dashboard/dak/pending">
            <StatCard
              title="Pending DAK"
              value={stats.pending}
              icon={Clock}
              variant="primary"
              description="Awaiting workflow action"
            />
          </Link>
          <Link href="/dashboard/dak/assigned">
            <StatCard
              title="Assigned DAK"
              value={stats.assigned}
              icon={ListChecks}
              variant="info"
              description="Allocated to departments or sections"
            />
          </Link>
          <Link href="/dashboard/dak/completed">
            <StatCard
              title="Completed DAK"
              value={stats.completed}
              icon={CheckCircle2}
              variant="success"
              description="Disposed and closed"
            />
          </Link>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Priority & Deadline Monitoring"
        description="Urgency levels and disposal timeline pressure"
        icon={AlertTriangle}
        variant="red"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Link href="/dashboard/dak/pending?priority=urgent">
            <StatCard
              title="High Priority"
              value={stats.highPriority}
              icon={Flame}
              variant="danger"
              description="Urgent & immediate pending"
            />
          </Link>
          <Link href="/dashboard/dak/pending?priority=important">
            <StatCard
              title="Medium Priority"
              value={stats.mediumPriority}
              icon={Clock}
              variant="orange"
              description="Normal priority pending"
            />
          </Link>
          <Link href="/dashboard/dak/pending?priority=routine">
            <StatCard
              title="Low Priority"
              value={stats.lowPriority}
              icon={Layers}
              variant="warning"
              description="Routine pending items"
            />
          </Link>
          <Link href="/dashboard/reports/pending">
            <StatCard
              title="Due Today"
              value={stats.dueToday}
              icon={Calendar}
              variant="orange"
              description="Disposal due today"
            />
          </Link>
          <Link href="/dashboard/reports/pending">
            <StatCard
              title="Due This Week"
              value={stats.dueThisWeek}
              icon={CalendarClock}
              variant="warning"
              description="Due within 7 days"
            />
          </Link>
          <Link href="/dashboard/reports/pending?overdue=1">
            <StatCard
              title="Overdue DAK"
              value={stats.overdue}
              icon={AlertTriangle}
              variant="danger"
              description="Past due date"
            />
          </Link>
        </div>
      </DashboardSection>

      <DashboardSection
        title="DAK Origin / Source Analysis"
        description="Receiving channel-wise pending correspondence"
        icon={Landmark}
        variant="purple"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <Link
            href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.CMO)}`}
          >
            <StatCard
              title="CMO"
              value={stats.cmoDak}
              icon={Landmark}
              variant="purple"
              description="Chief Minister's Office"
            />
          </Link>
          <Link
            href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.CHIEF_SECRETARY)}`}
          >
            <StatCard
              title="Chief Secretary"
              value={stats.chiefSecretaryRefs}
              icon={FileText}
              variant="indigo"
              description="Secretariat references"
            />
          </Link>
          <Link
            href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.MLA)}`}
          >
            <StatCard
              title="MP / MLA"
              value={stats.mlaReferences}
              icon={Users}
              variant="orange"
              description="Elected representative refs"
            />
          </Link>
          <Link
            href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.JAN_SUNWAI)}`}
          >
            <StatCard
              title="Jan Sunwai"
              value={stats.janSunwaiDak}
              icon={Users}
              variant="teal"
              description="Public hearing references"
            />
          </Link>
          <Link
            href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.COURT)}`}
          >
            <StatCard
              title="Court Cases"
              value={stats.courtCases}
              icon={Scale}
              variant="danger"
              description="Court-related pending"
            />
          </Link>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Department & Internal Section Performance"
        description="Workload distribution across departments and Collectorate sections"
        icon={Building2}
        variant="teal"
      >
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/reports/departments">
            <StatCard
              title="Department Pending"
              value={stats.departmentPending}
              icon={Building2}
              variant="teal"
              description="Pending at department level"
            />
          </Link>
          <Link href="/dashboard/reports/sections">
            <StatCard
              title="Internal Section Pending"
              value={stats.internalSectionPending}
              icon={Layers}
              variant="indigo"
              description="Collectorate section workload"
            />
          </Link>
        </div>
        <div className="space-y-4">
          <PendingDepartmentsTable rows={pendingDepartments} embedded />
          <PendingSectionsTable rows={pendingSections} embedded />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Insights & Analytics"
        description="High-impact metrics for district decision-making"
        icon={Percent}
        variant="indigo"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Link href="/dashboard/dak/completed">
            <StatCard
              title="Total Completed"
              value={stats.completed}
              icon={CheckCircle2}
              variant="success"
              description="Disposed correspondence"
            />
          </Link>
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRatePct}%`}
            icon={Percent}
            variant="indigo"
            description={`${stats.completed} of ${stats.total} DAK`}
          />
          <Link href="/dashboard/dak/pending?priority=urgent">
            <StatCard
              title="High Priority Pending"
              value={stats.highPriority}
              icon={Flame}
              variant="danger"
              description="Requires immediate attention"
            />
          </Link>
          <Link
            href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.CMO)}`}
          >
            <StatCard
              title="CMO Status"
              value={stats.cmoDak}
              icon={Landmark}
              variant="purple"
              description="Pending CMO DAK"
            />
          </Link>
          <Link
            href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.MLA)}`}
          >
            <StatCard
              title="MP/MLA Status"
              value={stats.mlaReferences}
              icon={Users}
              variant="orange"
              description="Pending elected refs"
            />
          </Link>
          <Link
            href={`/dashboard/reports/source?name=${encodeURIComponent(DAK_SOURCE_WIDGETS.CHIEF_SECRETARY)}`}
          >
            <StatCard
              title="CS Status"
              value={stats.chiefSecretaryRefs}
              icon={FileText}
              variant="indigo"
              description="Chief Secretary pending"
            />
          </Link>
        </div>
      </DashboardSection>
    </div>
  );
}
