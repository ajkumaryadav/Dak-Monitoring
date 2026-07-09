import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, History, Paperclip } from "lucide-react";

import { TaskActionPanel } from "@/features/tasks/components/task-action-panel";
import { TaskTimelinePanel } from "@/features/tasks/components/task-timeline-panel";
import {
  getTaskById,
  getTaskComplianceHistory,
  getTaskTimeline,
} from "@/features/tasks/services/tasks";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import { canManageTasks, requirePermission, PERMISSIONS } from "@/lib/auth";
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

  const [task, timeline, complianceHistory] = await Promise.all([
    getTaskById(id),
    getTaskTimeline(id),
    getTaskComplianceHistory(id),
  ]);

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
          <Badge
            variant="outline"
            className={cn("capitalize", PRIORITY_COLORS[task.priority])}
          >
            {task.priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{task.description || "—"}</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Department:</span>{" "}
            {deptName ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Officer:</span>{" "}
            {assigneeName ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Due:</span>{" "}
            {task.due_date ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            {formatDakDateTime(task.created_at)}
          </div>
        </dl>
      </div>

      <TaskActionPanel
        taskId={task.id}
        status={task.status}
        isTaskManager={!!isTaskManager}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-5">
          <div className="mb-4 flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h2 className="font-semibold">Task Timeline</h2>
          </div>
          <TaskTimelinePanel entries={timeline} />
        </div>

        <div className="rounded-xl border p-5">
          <div className="mb-4 flex items-center gap-2">
            <Paperclip className="size-4 text-primary" />
            <h2 className="font-semibold">ATR & Compliance History</h2>
          </div>
          {!complianceHistory.length ? (
            <p className="text-sm text-muted-foreground">
              No ATR or compliance submissions yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {complianceHistory.map((record) => (
                <li
                  key={record.id}
                  className="rounded-lg border border-border/60 bg-muted/20 p-3"
                >
                  <p className="text-xs text-muted-foreground">
                    {formatDakDateTime(record.createdAt)}
                    {record.submitterName ? ` · ${record.submitterName}` : ""}
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {record.complianceText}
                  </p>
                  {record.downloadUrl && (
                    <a
                      href={record.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Download className="size-3.5" />
                      Download attachment
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
