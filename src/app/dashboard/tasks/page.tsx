import Link from "next/link";
import { ListTodo, Plus } from "lucide-react";

import { TaskListTable } from "@/features/tasks/components/task-list-table";
import { getTaskStats, getTasks } from "@/features/tasks/services/tasks";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { buttonVariants } from "@/components/ui/button";
import {
  canManageTasks,
  isDepartmentDashboardRole,
  PERMISSIONS,
  requirePermission,
} from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  await requirePermission(PERMISSIONS.TASKS);
  const user = await getSessionUser();
  const scope =
    user && isDepartmentDashboardRole(user.role)
      ? { departmentId: user.departmentId }
      : user?.role === "section_user"
        ? { assignedTo: user.id }
        : undefined;

  const [tasks, stats] = await Promise.all([
    getTasks(scope),
    getTaskStats(scope),
  ]);

  const canCreate = user && canManageTasks(user.role);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Administrative Tasks"
        description="Parallel task assignments — election prep, VIP visits, inspections, and meeting decisions."
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

      {canCreate && (
        <Link
          href="/dashboard/tasks/new"
          className={cn(buttonVariants(), "h-9 w-fit gap-1.5 px-4")}
        >
          <Plus className="size-4" />
          Create Task
        </Link>
      )}

      <TaskListTable tasks={tasks} />
    </div>
  );
}
