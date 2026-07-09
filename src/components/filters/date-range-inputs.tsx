"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import {
  DATE_RANGE_ERROR_MESSAGE,
  validateDateRange,
} from "@/lib/validation/date-range";
import { cn } from "@/lib/utils";

interface DateRangeInputsProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
}

export function DateRangeInputs({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  className,
  inputClassName = "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30",
}: DateRangeInputsProps) {
  const [error, setError] = useState<string | null>(null);

  function handleFromChange(value: string) {
    onDateFromChange(value);
    const validation = validateDateRange(value, dateTo);
    setError(validation.valid ? null : validation.message ?? null);
  }

  function handleToChange(value: string) {
    onDateToChange(value);
    const validation = validateDateRange(dateFrom, value);
    setError(validation.valid ? null : validation.message ?? null);
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        <Label htmlFor="dateFrom">From Date</Label>
        <input
          id="dateFrom"
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(e) => handleFromChange(e.target.value)}
          className={cn(
            inputClassName,
            error && "border-destructive aria-invalid:border-destructive"
          )}
          aria-invalid={!!error}
        />
      </div>
      <div className={cn("space-y-2", className)}>
        <Label htmlFor="dateTo">To Date</Label>
        <input
          id="dateTo"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => handleToChange(e.target.value)}
          className={cn(
            inputClassName,
            error && "border-destructive aria-invalid:border-destructive"
          )}
          aria-invalid={!!error}
        />
      </div>
      {error && (
        <p
          className="text-sm text-destructive sm:col-span-2 lg:col-span-full"
          role="alert"
        >
          {error || DATE_RANGE_ERROR_MESSAGE}
        </p>
      )}
    </>
  );
}

/** Returns false when the range is invalid — use before applying filters. */
export function canApplyDateRange(dateFrom: string, dateTo: string): boolean {
  return validateDateRange(dateFrom, dateTo).valid;
}
