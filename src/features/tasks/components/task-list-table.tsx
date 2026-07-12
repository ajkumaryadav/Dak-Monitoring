import Link from "next/link";

import type { TaskRecord } from "@/features/tasks/services/tasks";
import { TASK_CATEGORY_OPTIONS } from "@/features/tasks/lib/task-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskListTableProps {
  tasks: TaskRecord[];
  showProgress?: boolean;
}

export function TaskListTable({
  tasks,
  showProgress = true,
}: TaskListTableProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        No tasks yet.
      </p>
    );
  }

  const categoryLabel = (value: string) =>
    TASK_CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Due</th>
            {showProgress && <th className="px-4 py-3">Progress</th>}
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const progress = task.progress;
            const pct = progress?.completionPct ?? 0;

            return (
              <tr
                key={task.id}
                className="border-b last:border-0 hover:bg-muted/20"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="font-medium hover:underline"
                  >
                    {task.title}
                  </Link>
                  {progress && progress.total > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {progress.total} assignee{progress.total === 1 ? "" : "s"}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {categoryLabel(task.category ?? "general")}
                </td>
                <td className="px-4 py-3">{task.due_date ?? "—"}</td>
                {showProgress && (
                  <td className="px-4 py-3">
                    {progress && progress.total > 0 ? (
                      <div className="min-w-[120px] space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{progress.completed}/{progress.total}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              pct === 100 ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize">
                    {task.status.replace(/_/g, " ")}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
