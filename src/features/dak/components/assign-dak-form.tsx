"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import {
  assignDakFormAction,
  type AssignDakFormState,
} from "@/features/dak/actions/assign-dak";
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
import type { AssignmentUnitOption } from "@/features/dak/services/get-assignment-units";
import type { DepartmentOfficerOption } from "@/features/dak/services/get-department-officers";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive md:text-sm dark:bg-input/30"
);

const initialState: AssignDakFormState = {};

interface AssignDakFormProps {
  dakId: string;
  departmentOfficers: DepartmentOfficerOption[];
  sections: AssignmentUnitOption[];
  isReassign?: boolean;
}

export function AssignDakForm({
  dakId,
  departmentOfficers,
  sections,
  isReassign = false,
}: AssignDakFormProps) {
  const [assignmentType, setAssignmentType] = useState<"department" | "section">(
    "department"
  );
  const [state, formAction, isPending] = useActionState(
    assignDakFormAction,
    initialState
  );

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.03] via-background to-background">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">
          {isReassign ? "Reassign DAK" : "Assign DAK"}
        </CardTitle>
        <CardDescription>
          {isReassign
            ? "Change department or internal section allocation"
            : "Allocate to an external department or internal Collectorate section"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form action={formAction} className="space-y-4">
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
                    onChange={() =>
                      setAssignmentType(option.value as "department" | "section")
                    }
                    className="size-4"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {assignmentType === "department" ? (
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department — Officer</Label>
              <select
                id="departmentId"
                name="departmentId"
                required
                defaultValue=""
                className={inputClassName}
                aria-invalid={!!state.errors?.departmentId}
              >
                <option value="" disabled>
                  Select department
                </option>
                {departmentOfficers.map((option) => (
                  <option key={option.departmentId} value={option.departmentId}>
                    {option.displayLabel}
                  </option>
                ))}
              </select>
              {state.errors?.departmentId?.[0] && (
                <p className="text-xs text-destructive">
                  {state.errors.departmentId[0]}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="assignmentUnitId">Internal Section</Label>
              <select
                id="assignmentUnitId"
                name="assignmentUnitId"
                required
                defaultValue=""
                className={inputClassName}
                aria-invalid={!!state.errors?.assignmentUnitId}
              >
                <option value="" disabled>
                  Select internal section
                </option>
                {sections.map((section) => (
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
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Assignment Remarks</Label>
            <textarea
              id="remarks"
              name="remarks"
              placeholder="Instructions for the assigned officer or section..."
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
            disabled={
              isPending ||
              (assignmentType === "department"
                ? departmentOfficers.length === 0
                : sections.length === 0)
            }
            className={cn(buttonVariants(), "h-9 w-full sm:w-auto")}
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
      </CardContent>
    </Card>
  );
}
