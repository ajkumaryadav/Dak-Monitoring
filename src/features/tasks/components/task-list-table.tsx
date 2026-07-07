import Link from "next/link";

import type { TaskRecord } from "@/features/tasks/services/tasks";
import { Badge } from "@/components/ui/badge";

interface TaskListTableProps {
  tasks: TaskRecord[];
}

export function TaskListTable({ tasks }: TaskListTableProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        No tasks yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Officer</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const dept = Array.isArray(task.departments)
              ? task.departments[0]?.name
              : task.departments?.name;
            const officer = Array.isArray(task.assignee)
              ? task.assignee[0]?.name
              : task.assignee?.name;
            return (
              <tr key={task.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/tasks/${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{dept ?? "—"}</td>
                <td className="px-4 py-3">{officer ?? "—"}</td>
                <td className="px-4 py-3">{task.due_date ?? "—"}</td>
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
