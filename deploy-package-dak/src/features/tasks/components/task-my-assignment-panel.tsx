"use client";

import { useActionState } from "react";
import { FileUp, Loader2 } from "lucide-react";

import {
  submitConsolidatedReportFormAction,
  submitTaskComplianceFormAction,
  updateAssigneeStatusFormAction,
} from "@/features/tasks/actions/task-actions";
import { ALLOWED_ATTACHMENT_ACCEPT } from "@/features/dak/lib/attachment-validation";
import type { TaskAssigneeRecord } from "@/features/tasks/services/task-assignees";
import type { TaskRecord } from "@/features/tasks/services/tasks";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getAssigneeDisplayStatus } from "@/features/tasks/lib/task-types";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
);

interface TaskMyAssignmentPanelProps {
  task: TaskRecord;
  assignment: TaskAssigneeRecord;
}

export function TaskMyAssignmentPanel({
  task,
  assignment,
}: TaskMyAssignmentPanelProps) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateAssigneeStatusFormAction,
    {}
  );
  const [complianceState, complianceAction, compliancePending] = useActionState(
    submitTaskComplianceFormAction,
    {}
  );
  const [reportState, reportAction, reportPending] = useActionState(
    submitConsolidatedReportFormAction,
    {}
  );

  const displayStatus = getAssigneeDisplayStatus(assignment.status);
  const isCompleted = assignment.status === "completed";
  const canWork =
    assignment.isActive && !isCompleted && task.status !== "closed";

  const showConsolidatedForm =
    assignment.isLead &&
    task.assignment_mode === "hybrid" &&
    task.status === "awaiting_consolidation" &&
    !task.consolidated_report_text;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">My Assignment</h2>
          <Badge variant="outline">{displayStatus}</Badge>
          {!assignment.isActive && (
            <Badge variant="outline" className="text-amber-700">
              Awaiting previous department (sequential)
            </Badge>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit your department&apos;s action taken summary and supporting
          documents. Other departments cannot view your submission.
        </p>
      </div>

      {canWork && assignment.status === "assigned" && (
        <form action={statusAction} className="rounded-xl border p-4">
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="assigneeId" value={assignment.id} />
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
      )}

      {canWork &&
        (assignment.status === "accepted" || assignment.status === "in_progress") && (
          <div className="space-y-4">
            {assignment.status === "accepted" && (
              <form action={statusAction} className="rounded-xl border p-4">
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="assigneeId" value={assignment.id} />
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
            >
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="assigneeId" value={assignment.id} />
              <div className="space-y-2">
                <Label htmlFor="complianceText">Action Taken Summary</Label>
                <textarea
                  id="complianceText"
                  name="complianceText"
                  required
                  minLength={10}
                  rows={4}
                  placeholder="Describe action taken, progress, and compliance status..."
                  className={cn(inputClassName, "min-h-24 py-2")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachment">Supporting Documents</Label>
                <input
                  id="attachment"
                  name="attachment"
                  type="file"
                  accept={ALLOWED_ATTACHMENT_ACCEPT}
                  className="block w-full text-sm"
                />
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
                Submit Progress
              </button>
            </form>
          </div>
        )}

      {isCompleted && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="font-medium text-emerald-800 dark:text-emerald-300">
            Your submission has been recorded.
          </p>
          {assignment.actionSummary && (
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {assignment.actionSummary}
            </p>
          )}
        </div>
      )}

      {showConsolidatedForm && (
        <form action={reportAction} className="space-y-4 rounded-xl border p-4">
          <input type="hidden" name="taskId" value={task.id} />
          <h3 className="font-semibold">Submit Consolidated Report</h3>
          <p className="text-sm text-muted-foreground">
            All supporting departments have submitted. Upload the consolidated
            outcome for Collector review.
          </p>
          <div className="space-y-2">
            <Label htmlFor="reportText">Consolidated Report Summary</Label>
            <textarea
              id="reportText"
              name="reportText"
              required
              minLength={10}
              rows={4}
              className={cn(inputClassName, "min-h-24 py-2")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consolidatedAttachment">Consolidated Document</Label>
            <input
              id="consolidatedAttachment"
              name="attachment"
              type="file"
              accept={ALLOWED_ATTACHMENT_ACCEPT}
              className="block w-full text-sm"
            />
          </div>
          {reportState.message && (
            <p className="text-sm text-destructive">{reportState.message}</p>
          )}
          <button
            type="submit"
            disabled={reportPending}
            className={cn(buttonVariants(), "h-9 px-4")}
          >
            {reportPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Submit Consolidated Report"
            )}
          </button>
        </form>
      )}

      {task.status === "closed" && (
        <p className="rounded-xl border p-4 text-sm text-muted-foreground">
          This task has been closed by the Collector.
        </p>
      )}
    </div>
  );
}
