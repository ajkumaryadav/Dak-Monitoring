"use client";

import { FilePlus2, Loader2 } from "lucide-react";
import { useActionState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createDakFormAction,
  type CreateDakFormState,
} from "@/features/dak/actions/create-dak";
import { AttachmentUpload } from "@/features/dak/components/attachment-upload";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { PRIORITY_OPTIONS } from "@/features/dak/schemas/dak-schema";
import type { DepartmentOption } from "@/features/dak/services/get-departments";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  "md:text-sm dark:bg-input/30"
);

const initialState: CreateDakFormState = {};

interface DakEntryFormProps {
  departments: DepartmentOption[];
}

export function DakEntryForm({ departments }: DakEntryFormProps) {
  const [state, formAction, isPending] = useActionState(
    createDakFormAction,
    initialState
  );
  const minDueDate = getDistrictDateString();

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-background to-background shadow-sm">
      <div className="border-b border-border/60 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <FilePlus2 className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              DAK Registration Form
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter correspondence details for diary registration
            </p>
          </div>
        </div>
      </div>

      {departments.length === 0 && (
        <p
          className="mx-5 mt-5 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 md:mx-6"
          role="alert"
        >
          No departments found. Refresh this page or run the Supabase seed
          migration.
        </p>
      )}

      <form
        action={formAction}
        encType="multipart/form-data"
        className="space-y-6 px-5 py-5 md:px-6 md:py-6"
      >
        {state.message && (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
            role="alert"
          >
            {state.message}
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="subject">Subject</Label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              minLength={5}
              placeholder="Subject of the correspondence"
              className={inputClassName}
              aria-invalid={!!state.errors?.subject}
            />
            {state.errors?.subject?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.subject[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="senderName">Sender Name</Label>
            <input
              id="senderName"
              name="senderName"
              type="text"
              required
              minLength={2}
              placeholder="Full name of sender"
              className={inputClassName}
              aria-invalid={!!state.errors?.senderName}
            />
            {state.errors?.senderName?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.senderName[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="senderAddress">Sender Address</Label>
            <input
              id="senderAddress"
              name="senderAddress"
              type="text"
              required
              minLength={5}
              placeholder="Postal address of sender"
              className={inputClassName}
              aria-invalid={!!state.errors?.senderAddress}
            />
            {state.errors?.senderAddress?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.senderAddress[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              required
              defaultValue=""
              className={inputClassName}
              aria-invalid={!!state.errors?.priority}
            >
              <option value="" disabled>
                Select priority
              </option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {state.errors?.priority?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.priority[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="departmentId">Department</Label>
            <select
              id="departmentId"
              name="departmentId"
              required
              defaultValue=""
              className={inputClassName}
              disabled={departments.length === 0}
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
              <p className="text-sm text-destructive" role="alert">
                {state.errors.departmentId[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              required
              min={minDueDate}
              className={cn(inputClassName, "w-full md:max-w-xs")}
              aria-invalid={!!state.errors?.dueDate}
            />
            {state.errors?.dueDate?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.dueDate[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="remarks">Remarks</Label>
            <textarea
              id="remarks"
              name="remarks"
              placeholder="Additional notes or instructions (optional)"
              className={cn(inputClassName, "min-h-24 resize-y py-2")}
              aria-invalid={!!state.errors?.remarks}
            />
            {state.errors?.remarks?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.remarks[0]}
              </p>
            )}
          </div>

          <AttachmentUpload error={state.errors?.attachment?.[0]} />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
          <button
            type="reset"
            disabled={isPending}
            className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={isPending || departments.length === 0}
            className={cn(buttonVariants(), "h-9 px-4 sm:min-w-40")}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving...
              </>
            ) : (
              "Register DAK"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
