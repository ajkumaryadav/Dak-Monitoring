import Link from "next/link";
import { ListTodo, Plus } from "lucide-react";

import { TaskListFilters } from "@/features/tasks/components/task-list-filters";
import { TaskListTable } from "@/features/tasks/components/task-list-table";
import { getTaskStats, getTasks } from "@/features/tasks/services/tasks";
import { getDepartments } from "@/features/dak/services/get-departments";
import { getAssignmentUnits } from "@/features/dak/services/get-assignment-units";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { buttonVariants } from "@/components/ui/button";
import {
  canManageTasks,
  isCollectorDashboardRole,
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";
import { sanitizeDateRangeParams } from "@/lib/validation/date-range";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { PriorityLevel } from "@/types";
import type { TaskStatus } from "@/features/tasks/services/tasks";

export const dynamic = "force-dynamic";

interface TasksPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    department?: string;
    section?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  await requirePermission(PERMISSIONS.TASKS);
  const user = await getSessionUser();
  const params = await searchParams;
  const { dateFrom, dateTo } = sanitizeDateRangeParams(
    params.dateFrom,
    params.dateTo
  );

  const isDistrict = user && isCollectorDashboardRole(user.role);

  const scope =
    user && !isDistrict
      ? { assignedTo: user.id }
      : params.department
        ? { departmentId: params.department }
        : undefined;

  const filterScope = {
    ...scope,
    status: (params.status || undefined) as
      | TaskStatus
      | "pending"
      | "completed"
      | "overdue"
      | undefined,
    priority: (params.priority || undefined) as PriorityLevel | undefined,
    dateFrom,
    dateTo,
  };

  const [tasks, stats, departments, sections] = await Promise.all([
    getTasks(filterScope),
    getTaskStats(scope),
    isDistrict ? getDepartments() : Promise.resolve([]),
    isDistrict ? getAssignmentUnits("section") : Promise.resolve([]),
  ]);

  const canCreate = user && canManageTasks(user.role);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Administrative Tasks"
        description="Multi-department task coordination with independent submissions, progress tracking, and consolidated reporting."
        icon={ListTodo}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Tasks" value={stats.total} icon={ListTodo} variant="primary" />
        <StatCard title="Pending" value={stats.pending} icon={ListTodo} variant="info" />
        <StatCard title="Overdue" value={stats.overdue} icon={ListTodo} variant="warning" />
        <StatCard
          title="Completion"
          value={`${stats.completionPct}%`}
          icon={ListTodo}
          variant="success"
        />
      </div>

      {isDistrict && (
        <TaskListFilters
          departments={departments}
          sections={sections}
          showDepartmentFilter
          showSectionFilter={false}
        />
      )}

      {canCreate && (
        <Link
          href="/dashboard/tasks/new"
          className={cn(buttonVariants(), "h-9 w-fit gap-1.5 px-4")}
        >
          <Plus className="size-4" />
          Create Task
        </Link>
      )}

      <TaskListTable tasks={tasks} showProgress={!!isDistrict} />
    </div>
  );
}
