"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { createTaskFormAction } from "@/features/tasks/actions/task-actions";
import { ASSIGN_PRIORITY_OPTIONS } from "@/features/dak/schemas/dak-schema";
import type { AssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
);

interface CreateTaskFormProps {
  options: AssignFormOptions;
  minDueDate: string;
}

export function CreateTaskForm({ options, minDueDate }: CreateTaskFormProps) {
  const [state, formAction, isPending] = useActionState(createTaskFormAction, {
    message: undefined as string | undefined,
  });

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-xl border p-6">
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
      <div className="space-y-2">
        <Label htmlFor="departmentId">Department</Label>
        <select
          id="departmentId"
          name="departmentId"
          required
          className={inputClassName}
          defaultValue=""
        >
          <option value="" disabled>
            Select department
          </option>
          {options.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="assignedTo">Officer</Label>
        <select
          id="assignedTo"
          name="assignedTo"
          required
          className={inputClassName}
          defaultValue=""
        >
          <option value="" disabled>
            Select officer
          </option>
          {options.officers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            required
            className={inputClassName}
            defaultValue="important"
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
            min={minDueDate}
            className={inputClassName}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <textarea
          id="remarks"
          name="remarks"
          rows={2}
          className={cn(inputClassName, "min-h-16 py-2")}
        />
      </div>
      <button type="submit" disabled={isPending} className={cn(buttonVariants(), "h-9 px-4")}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Assigning...
          </>
        ) : (
          "Assign Task"
        )}
      </button>
    </form>
  );
}
