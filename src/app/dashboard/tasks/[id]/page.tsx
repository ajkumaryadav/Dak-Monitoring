import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { TaskActionPanel } from "@/features/tasks/components/task-action-panel";
import { getTaskById } from "@/features/tasks/services/tasks";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { canManageTasks, requirePermission, PERMISSIONS } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  await requirePermission(PERMISSIONS.TASKS);
  const user = await getSessionUser();
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) notFound();

  const isTaskManager = user && canManageTasks(user.role);
  const deptName = Array.isArray(task.departments)
    ? task.departments[0]?.name
    : task.departments?.name;
  const assigneeName = Array.isArray(task.assignee)
    ? task.assignee[0]?.name
    : task.assignee?.name;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/tasks"
        className={cn(buttonVariants({ variant: "outline" }), "h-9 w-fit gap-1.5")}
      >
        <ArrowLeft className="size-4" />
        Back to Tasks
      </Link>
      <div className="space-y-3 rounded-xl border p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{task.title}</h1>
          <Badge variant="outline" className="capitalize">
            {task.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{task.description || "—"}</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Department:</span> {deptName ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Officer:</span> {assigneeName ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Due:</span> {task.due_date ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Priority:</span> {task.priority}
          </div>
        </dl>
      </div>

      <TaskActionPanel
        taskId={task.id}
        status={task.status}
        isTaskManager={!!isTaskManager}
      />
    </div>
  );
}
