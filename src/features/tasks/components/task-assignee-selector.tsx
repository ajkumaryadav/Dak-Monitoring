"use client";

import { useMemo, useState } from "react";
import { Building2, User } from "lucide-react";

import type { AssignFormOptions } from "@/features/dak/services/get-assign-form-options";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TaskAssigneeSelectorProps {
  options: AssignFormOptions;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  assignmentMode: "parallel" | "sequential" | "hybrid";
}

export function TaskAssigneeSelector({
  options,
  selectedIds,
  onChange,
  assignmentMode,
}: TaskAssigneeSelectorProps) {
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const deptMap = new Map(
      options.departments.map((d) => [d.id, d.name])
    );

    const byDept = new Map<
      string,
      { deptId: string; deptName: string; officers: typeof options.officers }
    >();

    for (const officer of options.officers) {
      const deptId = officer.departmentId ?? "unassigned";
      const deptName =
        (officer.departmentId && deptMap.get(officer.departmentId)) ||
        "Unassigned";
      const group = byDept.get(deptId) ?? {
        deptId,
        deptName,
        officers: [],
      };
      group.officers.push(officer);
      byDept.set(deptId, group);
    }

    return [...byDept.values()].sort((a, b) =>
      a.deptName.localeCompare(b.deptName)
    );
  }, [options]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouped;

    return grouped
      .map((group) => ({
        ...group,
        officers: group.officers.filter(
          (o) =>
            o.name.toLowerCase().includes(q) ||
            group.deptName.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.officers.length > 0);
  }, [grouped, search]);

  function toggleOfficer(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else if (assignmentMode === "sequential") {
      onChange([...selectedIds, id]);
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function toggleDepartment(deptId: string, officerIds: string[]) {
    const allSelected = officerIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onChange(selectedIds.filter((id) => !officerIds.includes(id)));
    } else {
      const merged = new Set([...selectedIds, ...officerIds]);
      onChange([...merged]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Assign To</Label>
        <span className="text-xs text-muted-foreground">
          {selectedIds.length} selected
          {assignmentMode === "sequential" && selectedIds.length > 0
            ? " · order = selection order"
            : ""}
        </span>
      </div>

      <input
        type="search"
        placeholder="Search department or officer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
      />

      <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border p-3">
        {filteredGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No officers found.</p>
        ) : (
          filteredGroups.map((group) => {
            const officerIds = group.officers.map((o) => o.id);
            const deptChecked = officerIds.every((id) =>
              selectedIds.includes(id)
            );
            const deptPartial =
              !deptChecked &&
              officerIds.some((id) => selectedIds.includes(id));

            return (
              <div key={group.deptId} className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={deptChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = deptPartial;
                    }}
                    onChange={() =>
                      toggleDepartment(group.deptId, officerIds)
                    }
                    className="size-4 rounded border-input"
                  />
                  <Building2 className="size-3.5 text-muted-foreground" />
                  {group.deptName}
                </label>
                <ul className="ml-6 space-y-1.5">
                  {group.officers.map((officer) => {
                    const orderIndex = selectedIds.indexOf(officer.id);
                    const isSelected = orderIndex >= 0;

                    return (
                      <li key={officer.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOfficer(officer.id)}
                            className="size-4 rounded border-input"
                          />
                          <User className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="flex-1">{officer.name}</span>
                          {assignmentMode === "sequential" && isSelected && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                              Step {orderIndex + 1}
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>

      {assignmentMode === "sequential" && selectedIds.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Departments receive the task one after another in the order shown above.
        </p>
      )}
    </div>
  );
}
