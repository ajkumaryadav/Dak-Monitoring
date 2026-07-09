"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  DateRangeInputs,
} from "@/components/filters/date-range-inputs";
import { useUrlDateRangeFilter } from "@/components/filters/use-url-date-range-filter";
import { Label } from "@/components/ui/label";
import type { AssignmentUnitOption } from "@/features/dak/services/get-assignment-units";
import type { DepartmentOption } from "@/features/dak/services/get-departments";
import type { DakSourceOption } from "@/features/dak/services/get-dak-sources";
import { PRIORITY_OPTIONS } from "@/features/dak/schemas/dak-schema";
import { STATUS_LABELS } from "@/features/dak/lib/workflow";
import type { DakStatus } from "@/types";

interface DakListFiltersProps {
  basePath: string;
  departments: DepartmentOption[];
  sources: DakSourceOption[];
  sections: AssignmentUnitOption[];
  showDepartmentFilter: boolean;
  /** When set, limit status options (e.g. pending vs completed lists). */
  statusMode?: "all" | "pending" | "completed";
}

const PENDING_STATUS_OPTIONS = Object.entries(STATUS_LABELS).filter(
  ([value]) => !["completed", "closed"].includes(value)
) as [DakStatus, string][];

const COMPLETED_STATUS_OPTIONS = Object.entries(STATUS_LABELS).filter(
  ([value]) => ["completed", "closed"].includes(value)
) as [DakStatus, string][];

export function DakListFilters({
  basePath,
  departments,
  sources,
  sections,
  showDepartmentFilter,
  statusMode = "all",
}: DakListFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    dateFrom,
    dateTo,
    updateDateFrom,
    updateDateTo,
  } = useUrlDateRangeFilter(basePath);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${basePath}?${params.toString()}`);
  }

  const statusOptions =
    statusMode === "pending"
      ? PENDING_STATUS_OPTIONS
      : statusMode === "completed"
        ? COMPLETED_STATUS_OPTIONS
        : (Object.entries(STATUS_LABELS) as [DakStatus, string][]);

  return (
    <div className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {showDepartmentFilter && (
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <select
            id="department"
            defaultValue={searchParams.get("department") ?? ""}
            onChange={(e) => updateParam("department", e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="source">Source</Label>
        <select
          id="source"
          defaultValue={searchParams.get("source") ?? ""}
          onChange={(e) => updateParam("source", e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="">All sources</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.source_name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="section">Section</Label>
        <select
          id="section"
          defaultValue={searchParams.get("section") ?? ""}
          onChange={(e) => updateParam("section", e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="">All sections</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.unit_name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          defaultValue={searchParams.get("priority") ?? ""}
          onChange={(e) => updateParam("priority", e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="">All statuses</option>
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <DateRangeInputs
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={updateDateFrom}
        onDateToChange={updateDateTo}
      />

      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <label className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-input px-3 text-sm dark:bg-input/30">
          <input
            type="checkbox"
            defaultChecked={searchParams.get("overdue") === "1"}
            onChange={(e) =>
              updateParam("overdue", e.target.checked ? "1" : "")
            }
            className="size-4 rounded border-input"
          />
          Overdue only
        </label>
      </div>
    </div>
  );
}
