"use client";

import { type FormEvent, type ReactNode, useState } from "react";

import {
  DATE_RANGE_ERROR_MESSAGE,
  validateDateRange,
} from "@/lib/validation/date-range";
import { cn } from "@/lib/utils";

interface GetFilterFormProps {
  action: string;
  className?: string;
  children: ReactNode;
}

/** GET filter form that blocks submit when the date range is invalid. */
export function GetFilterForm({ action, className, children }: GetFilterFormProps) {
  const [rangeError, setRangeError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const dateFrom =
      (form.elements.namedItem("dateFrom") as HTMLInputElement | null)?.value ??
      "";
    const dateTo =
      (form.elements.namedItem("dateTo") as HTMLInputElement | null)?.value ?? "";
    const validation = validateDateRange(dateFrom, dateTo);

    if (!validation.valid) {
      event.preventDefault();
      setRangeError(validation.message ?? DATE_RANGE_ERROR_MESSAGE);
      return;
    }

    setRangeError(null);
  }

  return (
    <form
      method="GET"
      action={action}
      onSubmit={handleSubmit}
      className={cn(className)}
    >
      {children}
      {rangeError && (
        <p
          className="text-sm text-destructive sm:col-span-2 lg:col-span-full"
          role="alert"
        >
          {rangeError}
        </p>
      )}
    </form>
  );
}
