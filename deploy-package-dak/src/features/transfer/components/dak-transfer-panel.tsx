"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";

import { transferDakFormAction } from "@/features/transfer/actions/transfer-dak";
import type { TransferActionOption } from "@/features/transfer/lib/transfer-types";
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
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none md:text-sm"
);

interface DakTransferPanelProps {
  dakId: string;
  actions: TransferActionOption[];
  departments: DepartmentOption[];
}

export function DakTransferPanel({
  dakId,
  actions,
  departments,
}: DakTransferPanelProps) {
  const [action, setAction] = useState<string>(actions[0]?.value ?? "");
  const [state, formAction, isPending] = useActionState(transferDakFormAction, {});

  if (actions.length === 0) return null;

  const needsDepartment = action === "transfer_department";

  return (
    <Card className="border-amber-500/20">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-base">Transfer / Escalate</CardTitle>
        <CardDescription>
          Forward, transfer, or escalate with mandatory remarks
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="dakId" value={dakId} />
          <div className="space-y-2">
            <Label htmlFor="transferAction">Action</Label>
            <select
              id="transferAction"
              name="action"
              required
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className={inputClassName}
            >
              {actions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {needsDepartment && (
            <div className="space-y-2">
              <Label htmlFor="toDepartmentId">Target Department</Label>
              <select
                id="toDepartmentId"
                name="toDepartmentId"
                required
                className={inputClassName}
                defaultValue=""
              >
                <option value="" disabled>
                  Select department
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="transferRemarks">Remarks *</Label>
            <textarea
              id="transferRemarks"
              name="remarks"
              required
              minLength={5}
              rows={3}
              placeholder="Reason for transfer or escalation..."
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
                Processing...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
