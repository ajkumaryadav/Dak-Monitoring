"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import {
  submitTaskComplianceFormAction,
  updateTaskStatusFormAction,
} from "@/features/tasks/actions/task-actions";
import type { TaskStatus } from "@/features/tasks/services/tasks";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
);

interface TaskActionPanelProps {
  taskId: string;
  status: TaskStatus;
  isTaskManager: boolean;
}

export function TaskActionPanel({
  taskId,
  status,
  isTaskManager,
}: TaskActionPanelProps) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateTaskStatusFormAction,
    {}
  );
  const [complianceState, complianceAction, compliancePending] = useActionState(
    submitTaskComplianceFormAction,
    {}
  );

  if (!isTaskManager && status === "assigned") {
    return (
      <form action={statusAction} className="rounded-xl border p-4">
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="status" value="accepted" />
        <button type="submit" disabled={statusPending} className={cn(buttonVariants(), "h-9 px-4")}>
          {statusPending ? <Loader2 className="size-4 animate-spin" /> : "Accept Task"}
        </button>
        {statusState.message && (
          <p className="mt-2 text-sm text-destructive">{statusState.message}</p>
        )}
      </form>
    );
  }

  if (!isTaskManager && (status === "accepted" || status === "in_progress")) {
    return (
      <div className="space-y-4">
        <form action={statusAction} className="rounded-xl border p-4">
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="status" value="in_progress" />
          <button
            type="submit"
            disabled={statusPending}
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
          >
            Mark In Progress
          </button>
        </form>
        <form action={complianceAction} className="rounded-xl border p-4 space-y-3">
          <input type="hidden" name="taskId" value={taskId} />
          <Label htmlFor="complianceText">Upload Compliance Report</Label>
          <textarea
            id="complianceText"
            name="complianceText"
            required
            minLength={10}
            rows={4}
            className={cn(inputClassName, "min-h-24 py-2")}
          />
          {complianceState.message && (
            <p className="text-sm text-destructive">{complianceState.message}</p>
          )}
          <button type="submit" disabled={compliancePending} className={cn(buttonVariants(), "h-9 px-4")}>
            {compliancePending ? <Loader2 className="size-4 animate-spin" /> : "Submit Compliance"}
          </button>
        </form>
      </div>
    );
  }

  if (isTaskManager && status === "compliance_submitted") {
    return (
      <div className="flex flex-wrap gap-2">
        <form action={statusAction}>
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="status" value="approved" />
          <button type="submit" disabled={statusPending} className={cn(buttonVariants(), "h-9 px-4")}>
            Approve
          </button>
        </form>
        <form action={statusAction}>
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="status" value="closed" />
          <button
            type="submit"
            disabled={statusPending}
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
          >
            Close Task
          </button>
        </form>
      </div>
    );
  }

  return null;
}
