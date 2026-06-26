"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import type { DepartmentOption } from "@/features/dak/services/get-departments";
import { PRIORITY_OPTIONS } from "@/features/dak/schemas/dak-schema";
import { STATUS_LABELS } from "@/features/dak/lib/workflow";
import type { DakStatus } from "@/types";

interface PendingReportFiltersProps {
  departments: DepartmentOption[];
  showDepartmentFilter: boolean;
}

const STATUS_FILTER_OPTIONS = Object.entries(STATUS_LABELS).filter(
  ([value]) =>
    !["completed", "closed"].includes(value)
) as [DakStatus, string][];

export function PendingReportFilters({
  departments,
  showDepartmentFilter,
}: PendingReportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/dashboard/reports/pending?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-5">
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
          {STATUS_FILTER_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateFrom">From Date</Label>
        <input
          id="dateFrom"
          type="date"
          defaultValue={searchParams.get("dateFrom") ?? ""}
          onChange={(e) => updateParam("dateFrom", e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateTo">To Date</Label>
        <input
          id="dateTo"
          type="date"
          defaultValue={searchParams.get("dateTo") ?? ""}
          onChange={(e) => updateParam("dateTo", e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
        />
      </div>

      <div className="flex items-end space-y-2">
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-input px-3 text-sm dark:bg-input/30">
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
