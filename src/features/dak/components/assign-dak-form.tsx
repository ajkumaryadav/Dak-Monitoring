"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import {
  assignDakFormAction,
  type AssignDakFormState,
} from "@/features/dak/actions/assign-dak";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { DepartmentOption } from "@/features/dak/services/get-departments";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive md:text-sm dark:bg-input/30"
);

const initialState: AssignDakFormState = {};

interface AssignDakFormProps {
  dakId: string;
  departments: DepartmentOption[];
}

export function AssignDakForm({ dakId, departments }: AssignDakFormProps) {
  const [state, formAction, isPending] = useActionState(
    assignDakFormAction,
    initialState
  );

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.03] via-background to-background">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Assign DAK</CardTitle>
        <CardDescription>
          Allocate this correspondence to a department for action
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="dakId" value={dakId} />

          <div className="space-y-2">
            <Label htmlFor="departmentId">Department</Label>
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
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
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
            <Label htmlFor="remarks">Assignment Remarks</Label>
            <textarea
              id="remarks"
              name="remarks"
              placeholder="Instructions for the department officer..."
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
            disabled={isPending || departments.length === 0}
            className={cn(buttonVariants(), "h-9 w-full sm:w-auto")}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign to Department"
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
