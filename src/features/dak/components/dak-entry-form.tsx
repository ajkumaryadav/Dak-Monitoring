"use client";

import { FilePlus2, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createDakFormAction,
  type CreateDakFormState,
} from "@/features/dak/actions/create-dak";
import { AttachmentUpload } from "@/features/dak/components/attachment-upload";
import { DuplicateApplicationsAlert } from "@/features/dak/components/duplicate-applications-alert";
import type { DepartmentOption } from "@/features/dak/services/get-departments";
import type { DakSourceOption } from "@/features/dak/services/get-dak-sources";
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
  sources: DakSourceOption[];
}

export function DakEntryForm({ departments, sources }: DakEntryFormProps) {
  const [mobile, setMobile] = useState("");
  const [state, formAction, isPending] = useActionState(
    createDakFormAction,
    initialState
  );

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
              Diary intake — priority and department assigned by Collector
            </p>
          </div>
        </div>
      </div>

      <form
        action={formAction}
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
            <Label htmlFor="applicantMobile">Applicant Mobile *</Label>
            <input
              id="applicantMobile"
              name="applicantMobile"
              type="tel"
              required
              minLength={10}
              maxLength={15}
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className={inputClassName}
              aria-invalid={!!state.errors?.applicantMobile}
            />
            {state.errors?.applicantMobile?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.applicantMobile[0]}
              </p>
            )}
            <DuplicateApplicationsAlert mobile={mobile} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="applicantReference">
              Aadhaar / Reference No.{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <input
              id="applicantReference"
              name="applicantReference"
              type="text"
              maxLength={50}
              placeholder="Reference number if available"
              className={inputClassName}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sourceId">DAK Source *</Label>
            <select
              id="sourceId"
              name="sourceId"
              required
              defaultValue=""
              className={inputClassName}
              disabled={sources.length === 0}
              aria-invalid={!!state.errors?.sourceId}
            >
              <option value="" disabled>
                Select DAK source
              </option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.source_name}
                </option>
              ))}
            </select>
            {state.errors?.sourceId?.[0] && (
              <p className="text-sm text-destructive" role="alert">
                {state.errors.sourceId[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="departmentId">
              Suggested Department{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <select
              id="departmentId"
              name="departmentId"
              defaultValue=""
              className={inputClassName}
              disabled={departments.length === 0}
              aria-invalid={!!state.errors?.departmentId}
            >
              <option value="">Not assigned — Collector will allocate</option>
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
            disabled={isPending || sources.length === 0}
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
