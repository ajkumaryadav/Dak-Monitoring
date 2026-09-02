"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  DateRangeInputs,
} from "@/components/filters/date-range-inputs";
import { useUrlDateRangeFilter } from "@/components/filters/use-url-date-range-filter";
import { Label } from "@/components/ui/label";
import { PRIORITY_OPTIONS } from "@/features/dak/schemas/dak-schema";

interface TaskListFiltersProps {
  departments: Array<{ id: string; name: string }>;
  sections: Array<{ id: string; unit_name: string }>;
  showDepartmentFilter: boolean;
  showSectionFilter: boolean;
}

export function TaskListFilters({
  departments,
  sections,
  showDepartmentFilter,
  showSectionFilter,
}: TaskListFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = "/dashboard/tasks";
  const { dateFrom, dateTo, updateDateFrom, updateDateTo } =
    useUrlDateRangeFilter(basePath);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        >
          <option value="">All tasks</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="compliance_submitted">ATR Submitted</option>
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
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

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

      {showSectionFilter && (
        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          <select
            id="section"
            defaultValue={searchParams.get("section") ?? ""}
            onChange={(e) => updateParam("section", e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.unit_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <DateRangeInputs
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={updateDateFrom}
        onDateToChange={updateDateTo}
      />
    </div>
  );
}
