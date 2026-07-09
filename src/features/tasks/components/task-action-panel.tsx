"use client";

import { useActionState } from "react";
import { FileUp, Loader2 } from "lucide-react";

import {
  submitTaskComplianceFormAction,
  updateTaskStatusFormAction,
} from "@/features/tasks/actions/task-actions";
import { ALLOWED_ATTACHMENT_ACCEPT } from "@/features/dak/lib/attachment-validation";
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
        <button
          type="submit"
          disabled={statusPending}
          className={cn(buttonVariants(), "h-9 px-4")}
        >
          {statusPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Accept Task"
          )}
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
        {status === "accepted" && (
          <form action={statusAction} className="rounded-xl border p-4">
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="status" value="in_progress" />
            <button
              type="submit"
              disabled={statusPending}
              className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
            >
              Mark Work In Progress
            </button>
          </form>
        )}

        <form
          action={complianceAction}
          className="space-y-4 rounded-xl border p-4"
          encType="multipart/form-data"
        >
          <input type="hidden" name="taskId" value={taskId} />
          <div className="space-y-2">
            <Label htmlFor="complianceText">ATR / Compliance Remarks</Label>
            <textarea
              id="complianceText"
              name="complianceText"
              required
              minLength={10}
              rows={4}
              placeholder="Describe action taken and compliance status..."
              className={cn(inputClassName, "min-h-24 py-2")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment">Upload ATR / Compliance Document</Label>
            <input
              id="attachment"
              name="attachment"
              type="file"
              accept={ALLOWED_ATTACHMENT_ACCEPT}
              className="block w-full text-sm"
            />
            <p className="text-xs text-muted-foreground">
              PDF, Word, Excel, images — approved office formats only.
            </p>
          </div>
          {complianceState.message && (
            <p className="text-sm text-destructive" role="alert">
              {complianceState.message}
            </p>
          )}
          <button
            type="submit"
            disabled={compliancePending}
            className={cn(buttonVariants(), "h-9 gap-2 px-4")}
          >
            {compliancePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileUp className="size-4" />
            )}
            Submit ATR & Compliance
          </button>
        </form>
      </div>
    );
  }

  if (isTaskManager && status === "compliance_submitted") {
    return (
      <div className="flex flex-wrap gap-2 rounded-xl border p-4">
        <form action={statusAction}>
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="status" value="approved" />
          <button
            type="submit"
            disabled={statusPending}
            className={cn(buttonVariants(), "h-9 px-4")}
          >
            Verify & Approve
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
