"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  ListTodo,
  Loader,
} from "lucide-react";

import { StatCard } from "@/features/dashboard/components/stat-card";
import type { TaskStatsSummary } from "@/features/tasks/services/tasks";

interface CollectorTaskStatCardsProps {
  stats: TaskStatsSummary;
}

/** District-level task insight cards for Collector and ADM dashboards. */
export function CollectorTaskStatCards({ stats }: CollectorTaskStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Link href="/dashboard/tasks">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          icon={ListTodo}
          variant="primary"
          description="All administrative tasks"
        />
      </Link>
      <Link href="/dashboard/tasks">
        <StatCard
          title="Assigned Tasks"
          value={stats.assigned}
          icon={ClipboardList}
          variant="info"
          description="Active assignments in pipeline"
        />
      </Link>
      <Link href="/dashboard/tasks">
        <StatCard
          title="Pending Tasks"
          value={stats.pending}
          icon={Loader}
          variant="warning"
          description="Awaiting completion"
        />
      </Link>
      <Link href="/dashboard/tasks">
        <StatCard
          title="Completed Tasks"
          value={stats.completed}
          icon={CheckCircle2}
          variant="success"
          description="Approved or closed"
        />
      </Link>
      <Link href="/dashboard/tasks">
        <StatCard
          title="Overdue Tasks"
          value={stats.overdue}
          icon={AlertTriangle}
          variant="danger"
          description="Past due date"
        />
      </Link>
    </div>
  );
}

interface DepartmentTaskStatCardsProps {
  stats: TaskStatsSummary;
}

/** Department-scoped task insight cards. */
export function DepartmentTaskStatCards({ stats }: DepartmentTaskStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Link href="/dashboard/tasks">
        <StatCard
          title="Total Assigned"
          value={stats.total}
          icon={ClipboardList}
          variant="primary"
          description="Tasks allocated to department"
        />
      </Link>
      <Link href="/dashboard/tasks">
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Loader}
          variant="info"
          description="Accepted or under compliance"
        />
      </Link>
      <Link href="/dashboard/tasks">
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          variant="success"
        />
      </Link>
      <Link href="/dashboard/tasks">
        <StatCard
          title="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          variant="warning"
          description="Requires immediate action"
        />
      </Link>
    </div>
  );
}
