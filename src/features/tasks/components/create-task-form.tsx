"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { createTaskFormAction } from "@/features/tasks/actions/task-actions";
import { TaskAssigneeSelector } from "@/features/tasks/components/task-assignee-selector";
import { usePriorityDueDate } from "@/features/dak/hooks/use-priority-due-date";
import { ASSIGN_PRIORITY_OPTIONS } from "@/features/dak/schemas/dak-schema";
import type { AssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import {
  TASK_ASSIGNMENT_MODE_OPTIONS,
  TASK_CATEGORY_OPTIONS,
  type TaskAssignmentMode,
} from "@/features/tasks/lib/task-types";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PriorityLevel } from "@/types";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
);

interface CreateTaskFormProps {
  options: AssignFormOptions;
  minDueDate: string;
}

export function CreateTaskForm({ options, minDueDate }: CreateTaskFormProps) {
  const {
    priority,
    setPriority,
    dueDate,
    setDueDate,
    minDate,
    manualOverride,
  } = usePriorityDueDate({ initialPriority: "important", minDate: minDueDate });

  const [assignmentMode, setAssignmentMode] =
    useState<TaskAssignmentMode>("parallel");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [leadDepartmentId, setLeadDepartmentId] = useState("");

  const [state, formAction, isPending] = useActionState(createTaskFormAction, {
    message: undefined as string | undefined,
  });

  const selectedDepartments = useMemo(() => {
    const deptIds = new Set<string>();
    for (const id of selectedAssignees) {
      const officer = options.officers.find((o) => o.id === id);
      if (officer?.departmentId) deptIds.add(officer.departmentId);
    }
    return options.departments.filter((d) => deptIds.has(d.id));
  }, [selectedAssignees, options]);

  return (
    <form action={formAction} className="max-w-2xl space-y-5 rounded-xl border p-6">
      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <input id="title" name="title" required className={inputClassName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className={cn(inputClassName, "min-h-20 py-2")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            required
            className={inputClassName}
            defaultValue="general"
          >
            {TASK_CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignmentMode">Assignment Mode</Label>
          <select
            id="assignmentMode"
            name="assignmentMode"
            required
            className={inputClassName}
            value={assignmentMode}
            onChange={(e) =>
              setAssignmentMode(e.target.value as TaskAssignmentMode)
            }
          >
            {TASK_ASSIGNMENT_MODE_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {
              TASK_ASSIGNMENT_MODE_OPTIONS.find(
                (m) => m.value === assignmentMode
              )?.description
            }
          </p>
        </div>
      </div>

      <input
        type="hidden"
        name="assigneeIds"
        value={selectedAssignees.join(",")}
      />

      <TaskAssigneeSelector
        options={options}
        selectedIds={selectedAssignees}
        onChange={setSelectedAssignees}
        assignmentMode={assignmentMode}
      />

      {assignmentMode === "hybrid" && selectedDepartments.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="leadDepartmentId">Lead / Nodal Department</Label>
          <select
            id="leadDepartmentId"
            name="leadDepartmentId"
            required
            className={inputClassName}
            value={leadDepartmentId}
            onChange={(e) => setLeadDepartmentId(e.target.value)}
          >
            <option value="" disabled>
              Select lead department
            </option>
            {selectedDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Lead department coordinates supporting departments and submits the
            consolidated report.
          </p>
        </div>
      )}

      {assignmentMode !== "hybrid" && (
        <input type="hidden" name="leadDepartmentId" value="" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            required
            className={inputClassName}
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
          >
            {ASSIGN_PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            min={minDate}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClassName}
          />
          <p className="text-xs text-muted-foreground">
            {manualOverride
              ? "Manually adjusted due date."
              : "Auto-calculated from priority."}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">Instructions / Remarks</Label>
        <textarea
          id="remarks"
          name="remarks"
          rows={2}
          placeholder="Specific instructions for all assignees..."
          className={cn(inputClassName, "min-h-16 py-2")}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || selectedAssignees.length === 0}
        className={cn(buttonVariants(), "h-9 px-4")}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating Task...
          </>
        ) : (
          `Create Task (${selectedAssignees.length} assignee${selectedAssignees.length === 1 ? "" : "s"})`
        )}
      </button>
    </form>
  );
}
