import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";

import { TaskCollectorReviewPanel } from "@/features/tasks/components/task-collector-review-panel";
import { TaskMyAssignmentPanel } from "@/features/tasks/components/task-my-assignment-panel";
import { TaskProgressPanel } from "@/features/tasks/components/task-progress-panel";
import { TaskTimelinePanel } from "@/features/tasks/components/task-timeline-panel";
import {
  getAssigneeComplianceHistory,
  getMyTaskAssignment,
  getTaskAssignees,
} from "@/features/tasks/services/task-assignees";
import {
  getConsolidatedReportDownloadUrl,
  getTaskById,
  getTaskTimeline,
} from "@/features/tasks/services/tasks";
import {
  TASK_ASSIGNMENT_MODE_OPTIONS,
  TASK_CATEGORY_OPTIONS,
} from "@/features/tasks/lib/task-types";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import {
  canManageTasks,
  requirePermission,
  PERMISSIONS,
} from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  immediate: "border-destructive/40 bg-destructive/10 text-destructive",
  urgent: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  important: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  routine: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

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
  const myAssignment =
    user && !isTaskManager
      ? await getMyTaskAssignment(id, user.id)
      : null;

  if (!isTaskManager && !myAssignment) {
    notFound();
  }

  const [assignees, masterTimeline] = await Promise.all([
    isTaskManager ? getTaskAssignees(id) : Promise.resolve([]),
    getTaskTimeline(
      id,
      isTaskManager || !myAssignment
        ? {}
        : { assigneeId: myAssignment.id }
    ),
  ]);

  const assigneesWithCompliance = isTaskManager
    ? await Promise.all(
        assignees.map(async (assignee) => ({
          ...assignee,
          compliance: await getAssigneeComplianceHistory(assignee.id),
        }))
      )
    : [];

  const consolidatedReportUrl = task.consolidated_report_path
    ? await getConsolidatedReportDownloadUrl(task.consolidated_report_path)
    : null;

  const categoryLabel =
    TASK_CATEGORY_OPTIONS.find((c) => c.value === (task.category ?? "general"))
      ?.label ?? "General";

  const modeLabel =
    TASK_ASSIGNMENT_MODE_OPTIONS.find(
      (m) => m.value === (task.assignment_mode ?? "parallel")
    )?.label ?? "Parallel";

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
          <Badge
            variant="outline"
            className={cn("capitalize", PRIORITY_COLORS[task.priority])}
          >
            {task.priority}
          </Badge>
          <Badge variant="outline">{categoryLabel}</Badge>
          <Badge variant="outline">{modeLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{task.description || "—"}</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-muted-foreground">Due Date:</span>{" "}
            {task.due_date ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            {formatDakDateTime(task.created_at)}
          </div>
          {task.assigneeCount ? (
            <div>
              <span className="text-muted-foreground">Assignees:</span>{" "}
              {task.assigneeCount}
            </div>
          ) : null}
          {task.remarks && (
            <div className="sm:col-span-2 lg:col-span-3">
              <span className="text-muted-foreground">Instructions:</span>{" "}
              {task.remarks}
            </div>
          )}
        </dl>
      </div>

      {isTaskManager && task.progress && task.progress.total > 0 && (
        <TaskProgressPanel progress={task.progress} />
      )}

      {isTaskManager ? (
        <TaskCollectorReviewPanel
          task={task}
          assignees={assigneesWithCompliance}
          consolidatedReportUrl={consolidatedReportUrl}
          isTaskManager
        />
      ) : myAssignment ? (
        <TaskMyAssignmentPanel task={task} assignment={myAssignment} />
      ) : null}

      <div className="rounded-xl border p-5">
        <div className="mb-4 flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h2 className="font-semibold">
            {isTaskManager ? "Task Activity" : "My Activity Timeline"}
          </h2>
        </div>
        <TaskTimelinePanel entries={masterTimeline} />
      </div>
    </div>
  );
}
