"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";

import { submitDakRequestFormAction } from "@/features/dak-requests/actions/submit-dak-request";
import type { DakRequestType } from "@/features/dak-requests/lib/request-types";
import type { DepartmentOption } from "@/features/dak/services/get-departments";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none md:text-sm"
);

interface DakDepartmentActionsPanelProps {
  dakId: string;
  departments: DepartmentOption[];
  currentDepartmentId?: string | null;
}

const ACTION_OPTIONS: { value: DakRequestType; label: string; description: string }[] = [
  {
    value: "transfer",
    label: "Request Transfer",
    description: "When this DAK belongs to another department",
  },
  {
    value: "escalation",
    label: "Request Escalation",
    description: "When administrative guidance is required",
  },
  {
    value: "extension",
    label: "Request Due Date Extension",
    description: "When more time is needed for disposal",
  },
];

export function DakDepartmentActionsPanel({
  dakId,
  departments,
  currentDepartmentId,
}: DakDepartmentActionsPanelProps) {
  const [action, setAction] = useState<DakRequestType>("transfer");
  const [state, formAction, isPending] = useActionState(
    submitDakRequestFormAction,
    {}
  );

  const minDueDate = getDistrictDateString();
  const transferDepartments = departments.filter(
    (dept) => dept.id !== currentDepartmentId
  );

  return (
    <Card className="border-primary/15">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Department Actions</CardTitle>
        <CardDescription>
          Submit transfer, escalation, or extension requests for Collector/ADM
          approval. ATR/compliance is submitted from the ATR tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <div className="grid gap-2">
          {ACTION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAction(option.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                action === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:bg-muted/50"
              )}
            >
              <p className="font-medium">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </button>
          ))}
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="dakId" value={dakId} />
          <input type="hidden" name="requestType" value={action} />

          {action === "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="targetDepartmentId">Target Department</Label>
              <select
                id="targetDepartmentId"
                name="targetDepartmentId"
                required
                className={inputClassName}
                defaultValue=""
              >
                <option value="" disabled>
                  Select department
                </option>
                {transferDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {action === "extension" && (
            <div className="space-y-2">
              <Label htmlFor="requestedDueDate">Requested New Due Date</Label>
              <input
                id="requestedDueDate"
                name="requestedDueDate"
                type="date"
                required
                min={minDueDate}
                className={inputClassName}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="requestRemarks">
              {action === "extension" ? "Reason *" : "Remarks *"}
            </Label>
            <textarea
              id="requestRemarks"
              name="remarks"
              required
              minLength={5}
              rows={3}
              placeholder="Provide mandatory justification for this request..."
              className={cn(inputClassName, "min-h-20 resize-y py-2")}
            />
          </div>

          {state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={cn(buttonVariants(), "h-9 w-full sm:w-auto")}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              ACTION_OPTIONS.find((o) => o.value === action)?.label ?? "Submit Request"
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
