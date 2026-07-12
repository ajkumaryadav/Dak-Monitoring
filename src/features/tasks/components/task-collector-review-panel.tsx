"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Download,
  Loader2,
} from "lucide-react";

import { closeTaskFormAction } from "@/features/tasks/actions/task-actions";
import {
  getAssigneeDisplayStatus,
  TASK_ASSIGNMENT_MODE_OPTIONS,
} from "@/features/tasks/lib/task-types";
import type { TaskAssigneeRecord } from "@/features/tasks/services/task-assignees";
import type { AssigneeComplianceRecord } from "@/features/tasks/services/task-assignees";
import type { TaskRecord } from "@/features/tasks/services/tasks";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDakDateTime } from "@/features/dak/lib/dak-display";
import { cn } from "@/lib/utils";
import { useActionState } from "react";

interface AssigneeSubmission extends TaskAssigneeRecord {
  compliance: AssigneeComplianceRecord[];
}

interface TaskCollectorReviewPanelProps {
  task: TaskRecord;
  assignees: AssigneeSubmission[];
  consolidatedReportUrl: string | null;
  isTaskManager: boolean;
}

export function TaskCollectorReviewPanel({
  task,
  assignees,
  consolidatedReportUrl,
  isTaskManager,
}: TaskCollectorReviewPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [closeState, closeAction, closePending] = useActionState(
    closeTaskFormAction,
    {}
  );

  const modeLabel =
    TASK_ASSIGNMENT_MODE_OPTIONS.find((m) => m.value === task.assignment_mode)
      ?.label ?? task.assignment_mode;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Department Submissions</h2>
          <Badge variant="outline">{modeLabel}</Badge>
        </div>

        <ul className="divide-y">
          {assignees.map((assignee) => {
            const displayStatus = getAssigneeDisplayStatus(assignee.status);
            const isExpanded = expandedId === assignee.id;
            const latestCompliance = assignee.compliance[0];

            return (
              <li key={assignee.id} className="py-3">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : assignee.id)
                  }
                  className="flex w-full items-start gap-3 text-left"
                >
                  <StatusIcon status={displayStatus} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {assignee.departmentName ?? assignee.officerName}
                      </span>
                      {assignee.isLead && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Crown className="size-3" />
                          Lead
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          displayStatus === "Completed" &&
                            "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
                          displayStatus === "In Progress" &&
                            "border-sky-500/40 bg-sky-500/10 text-sky-700",
                          displayStatus === "Pending" &&
                            "border-amber-500/40 bg-amber-500/10 text-amber-700"
                        )}
                      >
                        {displayStatus}
                      </Badge>
                      {!assignee.isActive && assignee.status === "pending" && (
                        <Badge variant="outline" className="text-xs">
                          Awaiting activation
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {assignee.officerName}
                      {assignee.completedAt
                        ? ` · Completed ${formatDakDateTime(assignee.completedAt)}`
                        : ""}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-9 mt-3 space-y-3 rounded-lg border bg-muted/20 p-4">
                    {assignee.actionSummary || latestCompliance ? (
                      <>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Action Taken Summary
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">
                            {assignee.actionSummary ??
                              latestCompliance?.complianceText ??
                              "—"}
                          </p>
                        </div>
                        {latestCompliance?.downloadUrl && (
                          <a
                            href={latestCompliance.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            <Download className="size-4" />
                            View attachment
                          </a>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No submission yet.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {task.consolidated_report_text && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="font-semibold">Consolidated Report (Lead Department)</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">
            {task.consolidated_report_text}
          </p>
          {consolidatedReportUrl && (
            <a
              href={consolidatedReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <Download className="size-4" />
              Download consolidated document
            </a>
          )}
          {task.consolidated_report_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              Submitted {formatDakDateTime(task.consolidated_report_at)}
            </p>
          )}
        </div>
      )}

      {isTaskManager && task.status !== "closed" && (
        <form action={closeAction} className="rounded-xl border p-4">
          <input type="hidden" name="taskId" value={task.id} />
          <p className="mb-3 text-sm text-muted-foreground">
            Close this task when all departmental submissions have been reviewed.
            Individual assignees do not need to all complete for manual closure.
          </p>
          <textarea
            name="remarks"
            rows={2}
            placeholder="Closing remarks (optional)"
            className="mb-3 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
          />
          {closeState.message && (
            <p className="mb-2 text-sm text-destructive">{closeState.message}</p>
          )}
          <button
            type="submit"
            disabled={closePending}
            className={cn(buttonVariants(), "h-9 px-4")}
          >
            {closePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Close Task"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function StatusIcon({
  status,
}: {
  status: "Pending" | "In Progress" | "Completed";
}) {
  if (status === "Completed") {
    return <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />;
  }
  if (status === "In Progress") {
    return <Clock className="size-5 shrink-0 text-sky-600" />;
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 text-xs font-bold text-amber-600">
      ·
    </span>
  );
}
