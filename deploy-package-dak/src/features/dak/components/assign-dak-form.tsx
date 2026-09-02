"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import {
  assignDakFormAction,
  type AssignDakFormState,
} from "@/features/dak/actions/assign-dak";
import { usePriorityDueDate } from "@/features/dak/hooks/use-priority-due-date";
import { ASSIGN_PRIORITY_OPTIONS } from "@/features/dak/schemas/dak-schema";
import { ASSIGNMENT_TYPE_OPTIONS } from "@/features/dak/schemas/assign-schema";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import type { PriorityLevel } from "@/types";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive md:text-sm dark:bg-input/30"
);

const initialState: AssignDakFormState = {};

interface AssignDakFormProps {
  dakId: string;
  options: AssignFormOptions;
  isReassign?: boolean;
  /** Drop outer Card chrome when nested inside Available Actions. */
  embedded?: boolean;
}

export function AssignDakForm({
  dakId,
  options,
  isReassign = false,
  embedded = false,
}: AssignDakFormProps) {
  const [assignmentType, setAssignmentType] = useState<"department" | "section">(
    "department"
  );
  const [departmentId, setDepartmentId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const {
    priority,
    setPriority,
    dueDate,
    setDueDate,
    minDate,
    manualOverride,
  } = usePriorityDueDate({ initialPriority: "important" });
  const [state, formAction, isPending] = useActionState(
    assignDakFormAction,
    initialState
  );

  const officerOptions = useMemo(() => {
    if (assignmentType === "department") {
      if (!departmentId) return [];
      return options.officers.filter((o) => o.departmentId === departmentId);
    }
    if (!sectionId) return [];
    return options.officers.filter((o) => o.sectionId === sectionId);
  }, [assignmentType, departmentId, sectionId, options.officers]);

  const canSubmit =
    assignmentType === "department"
      ? options.departments.length > 0
      : options.sections.length > 0;

  const title = isReassign ? "Reassign DAK" : "Assign DAK";
  const description = isReassign
    ? "Change department/section and assigned officer"
    : "Select department or internal section, then choose the responsible officer";

  const form = (
        <form action={formAction} className={cn(embedded ? "space-y-3" : "space-y-4")}>
          <input type="hidden" name="dakId" value={dakId} />
          <input type="hidden" name="assignmentType" value={assignmentType} />

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Assignment Type</legend>
            <div className="flex flex-wrap gap-4">
              {ASSIGNMENT_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="assignmentTypeChoice"
                    value={option.value}
                    checked={assignmentType === option.value}
                    onChange={() => {
                      setAssignmentType(option.value as "department" | "section");
                      setDepartmentId("");
                      setSectionId("");
                    }}
                    className="size-4"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {assignmentType === "department" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <select
                  id="departmentId"
                  name="departmentId"
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className={inputClassName}
                  aria-invalid={!!state.errors?.departmentId}
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  {options.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {state.errors?.departmentId?.[0] && (
                  <p className="text-xs text-destructive">
                    {state.errors.departmentId[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedUserIdDept">Officer</Label>
                <select
                  id="assignedUserIdDept"
                  key={departmentId}
                  name="assignedUserId"
                  required
                  disabled={!departmentId || officerOptions.length === 0}
                  defaultValue=""
                  className={inputClassName}
                  aria-invalid={!!state.errors?.assignedUserId}
                >
                  <option value="" disabled>
                    {!departmentId
                      ? "Select a department first"
                      : officerOptions.length === 0
                        ? "No officers in this department"
                        : "Select officer"}
                  </option>
                  {officerOptions.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name}
                    </option>
                  ))}
                </select>
                {state.errors?.assignedUserId?.[0] && (
                  <p className="text-xs text-destructive">
                    {state.errors.assignedUserId[0]}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="assignmentUnitId">Internal Section</Label>
                <select
                  id="assignmentUnitId"
                  name="assignmentUnitId"
                  required
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className={inputClassName}
                  aria-invalid={!!state.errors?.assignmentUnitId}
                >
                  <option value="" disabled>
                    Select internal section
                  </option>
                  {options.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.unit_name}
                    </option>
                  ))}
                </select>
                {state.errors?.assignmentUnitId?.[0] && (
                  <p className="text-xs text-destructive">
                    {state.errors.assignmentUnitId[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedUserIdSection">Officer</Label>
                <select
                  id="assignedUserIdSection"
                  key={sectionId}
                  name="assignedUserId"
                  required
                  disabled={!sectionId || officerOptions.length === 0}
                  defaultValue=""
                  className={inputClassName}
                  aria-invalid={!!state.errors?.assignedUserId}
                >
                  <option value="" disabled>
                    {!sectionId
                      ? "Select a section first"
                      : officerOptions.length === 0
                        ? "No officers in this section"
                        : "Select officer"}
                  </option>
                  {officerOptions.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                required
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className={inputClassName}
                aria-invalid={!!state.errors?.priority}
              >
                {ASSIGN_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {state.errors?.priority?.[0] && (
                <p className="text-xs text-destructive">
                  {state.errors.priority[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Disposal Due Date</Label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                min={minDate}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClassName}
                aria-invalid={!!state.errors?.dueDate}
              />
              <p className="text-xs text-muted-foreground">
                {manualOverride
                  ? "Manually adjusted — changing priority will not overwrite this date until reset."
                  : "Auto-calculated from priority. You may adjust if required."}
              </p>
              {state.errors?.dueDate?.[0] && (
                <p className="text-xs text-destructive">
                  {state.errors.dueDate[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Collector Remarks / Instructions</Label>
            <textarea
              id="remarks"
              name="remarks"
              placeholder="Instructions for the assigned officer..."
              rows={3}
              maxLength={500}
              className={cn(inputClassName, "min-h-20 resize-y py-2")}
            />
          </div>

          {state.message && (
            <p className="text-sm text-destructive" role="alert">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className={cn(buttonVariants(), "h-9 w-full")}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Assigning...
              </>
            ) : isReassign ? (
              "Reassign DAK"
            ) : assignmentType === "department" ? (
              "Assign to Department"
            ) : (
              "Assign to Section"
            )}
          </button>
        </form>
  );

  if (embedded) {
    return (
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        {form}
      </div>
    );
  }

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.03] via-background to-background">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">{form}</CardContent>
    </Card>
  );
}
