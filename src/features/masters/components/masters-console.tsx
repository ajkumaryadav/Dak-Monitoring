"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Loader2,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  createDepartmentAction,
  createSectionAction,
  deleteDepartmentAction,
  deleteSectionAction,
  reorderDepartmentsAction,
  toggleDepartmentActiveAction,
  toggleSectionActiveAction,
  updateDepartmentAction,
  updateSectionAction,
} from "@/features/masters/actions/master-actions";
import type {
  DepartmentMasterRow,
  SectionMasterRow,
} from "@/features/masters/services/master-service";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MasterTab = "departments" | "sections";

interface MastersConsoleProps {
  departments: DepartmentMasterRow[];
  sections: SectionMasterRow[];
}

export function MastersConsole({
  departments,
  sections,
}: MastersConsoleProps) {
  const router = useRouter();
  const deptFormRef = useRef<HTMLFormElement>(null);
  const sectionFormRef = useRef<HTMLFormElement>(null);
  const [tab, setTab] = useState<MasterTab>("departments");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [deptForm, setDeptForm] = useState({
    id: "" as string,
    name: "",
    shortName: "",
    description: "",
    isActive: true,
  });
  const [sectionForm, setSectionForm] = useState({
    id: "" as string,
    unitName: "",
    departmentId: "",
    description: "",
    isActive: true,
  });

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.shortName ?? "").toLowerCase().includes(q)
    );
  }, [departments, search]);

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) =>
        s.unitName.toLowerCase().includes(q) ||
        (s.departmentName ?? "").toLowerCase().includes(q)
    );
  }, [sections, search]);

  function run(
    action: () => Promise<{ success: boolean; message?: string }>,
    ok: string
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(ok);
        setDeptForm({
          id: "",
          name: "",
          shortName: "",
          description: "",
          isActive: true,
        });
        setSectionForm({
          id: "",
          unitName: "",
          departmentId: "",
          description: "",
          isActive: true,
        });
        router.refresh();
      } else {
        toast.error(result.message ?? "Operation failed");
      }
    });
  }

  const scrollToForm = useCallback((ref: React.RefObject<HTMLFormElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  function moveDepartment(id: string, direction: -1 | 1) {
    const ids = departments.map((d) => d.id);
    const index = ids.indexOf(id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ids.length) return;
    const ordered = [...ids];
    const [item] = ordered.splice(index, 1);
    ordered.splice(next, 0, item);
    run(async () => reorderDepartmentsAction(ordered), "Order updated");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1">
        {(
          [
            ["departments", "Departments"],
            ["sections", "Internal Sections"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold",
              tab === id
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab}…`}
          className="pl-9"
        />
      </div>

      {tab === "departments" ? (
        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <form
            ref={deptFormRef}
            className={cn(
              "space-y-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors",
              deptForm.id && "ring-2 ring-primary/40"
            )}
            onSubmit={(e) => {
              e.preventDefault();
              const payload = {
                name: deptForm.name,
                shortName: deptForm.shortName,
                description: deptForm.description,
                isActive: deptForm.isActive,
              };
              if (deptForm.id) {
                run(
                  async () => updateDepartmentAction(deptForm.id, payload),
                  "Department updated"
                );
              } else {
                run(
                  async () => createDepartmentAction(payload),
                  "Department created"
                );
              }
            }}
          >
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <h2 className="text-sm font-bold">
                {deptForm.id ? "Edit Department" : "Add Department"}
              </h2>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-name">Department Name</Label>
              <Input
                id="dept-name"
                required
                value={deptForm.name}
                onChange={(e) =>
                  setDeptForm((s) => ({ ...s, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-short">Short Name</Label>
              <Input
                id="dept-short"
                value={deptForm.shortName}
                onChange={(e) =>
                  setDeptForm((s) => ({ ...s, shortName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-desc">Description</Label>
              <textarea
                id="dept-desc"
                rows={3}
                value={deptForm.description}
                onChange={(e) =>
                  setDeptForm((s) => ({ ...s, description: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={deptForm.isActive}
                onChange={(e) =>
                  setDeptForm((s) => ({ ...s, isActive: e.target.checked }))
                }
              />
              Active
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={pending}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                {deptForm.id ? "Save Changes" : "Add Department"}
              </button>
              {deptForm.id ? (
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  onClick={() =>
                    setDeptForm({
                      id: "",
                      name: "",
                      shortName: "",
                      description: "",
                      isActive: true,
                    })
                  }
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Short</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Users</th>
                  <th className="px-3 py-2">DAK</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "h-7 w-7 p-0"
                          )}
                          onClick={() => moveDepartment(row.id, -1)}
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "h-7 w-7 p-0"
                          )}
                          onClick={() => moveDepartment(row.id, 1)}
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2">{row.shortName ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={row.isActive ? "secondary" : "outline"}>
                        {row.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.userCount}</td>
                    <td className="px-3 py-2 tabular-nums">{row.dakCount}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "gap-1"
                          )}
                          onClick={() => {
                            setDeptForm({
                              id: row.id,
                              name: row.name,
                              shortName: row.shortName ?? "",
                              description: row.description ?? "",
                              isActive: row.isActive,
                            });
                            scrollToForm(deptFormRef);
                          }}
                        >
                          <Pencil className="size-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                          onClick={() =>
                            run(
                              async () =>
                                toggleDepartmentActiveAction(
                                  row.id,
                                  !row.isActive
                                ),
                              row.isActive ? "Deactivated" : "Activated"
                            )
                          }
                        >
                          {row.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          disabled={!row.canDelete}
                          title={
                            row.canDelete
                              ? "Delete department"
                              : "Linked users or DAK — deactivate instead"
                          }
                          className={cn(
                            buttonVariants({
                              variant: "destructive",
                              size: "sm",
                            })
                          )}
                          onClick={() =>
                            run(
                              async () => deleteDepartmentAction(row.id),
                              "Department deleted"
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <form
            ref={sectionFormRef}
            className={cn(
              "space-y-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors",
              sectionForm.id && "ring-2 ring-primary/40"
            )}
            onSubmit={(e) => {
              e.preventDefault();
              const payload = {
                unitName: sectionForm.unitName,
                departmentId: sectionForm.departmentId,
                description: sectionForm.description,
                isActive: sectionForm.isActive,
              };
              if (sectionForm.id) {
                run(
                  async () => updateSectionAction(sectionForm.id, payload),
                  "Section updated"
                );
              } else {
                run(
                  async () => createSectionAction(payload),
                  "Section created"
                );
              }
            }}
          >
            <h2 className="text-sm font-bold">
              {sectionForm.id ? "Edit Section" : "Add Section"}
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="sec-name">Section Name</Label>
              <Input
                id="sec-name"
                required
                value={sectionForm.unitName}
                onChange={(e) =>
                  setSectionForm((s) => ({ ...s, unitName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sec-dept">Parent Department</Label>
              <select
                id="sec-dept"
                value={sectionForm.departmentId}
                onChange={(e) =>
                  setSectionForm((s) => ({
                    ...s,
                    departmentId: e.target.value,
                  }))
                }
                className="h-9 w-full rounded-lg border px-2 text-sm"
              >
                <option value="">— None —</option>
                {departments
                  .filter((d) => d.isActive)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sec-desc">Description</Label>
              <textarea
                id="sec-desc"
                rows={3}
                value={sectionForm.description}
                onChange={(e) =>
                  setSectionForm((s) => ({
                    ...s,
                    description: e.target.value,
                  }))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sectionForm.isActive}
                onChange={(e) =>
                  setSectionForm((s) => ({
                    ...s,
                    isActive: e.target.checked,
                  }))
                }
              />
              Active
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={pending}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                {sectionForm.id ? "Save Changes" : "Add Section"}
              </button>
              {sectionForm.id ? (
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" })
                  )}
                  onClick={() =>
                    setSectionForm({
                      id: "",
                      unitName: "",
                      departmentId: "",
                      description: "",
                      isActive: true,
                    })
                  }
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Parent Dept</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Users</th>
                  <th className="px-3 py-2">DAK</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{row.unitName}</td>
                    <td className="px-3 py-2">{row.departmentName ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={row.isActive ? "secondary" : "outline"}>
                        {row.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.userCount}</td>
                    <td className="px-3 py-2 tabular-nums">{row.dakCount}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "gap-1"
                          )}
                          onClick={() => {
                            setSectionForm({
                              id: row.id,
                              unitName: row.unitName,
                              departmentId: row.departmentId ?? "",
                              description: row.description ?? "",
                              isActive: row.isActive,
                            });
                            scrollToForm(sectionFormRef);
                          }}
                        >
                          <Pencil className="size-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                          onClick={() =>
                            run(
                              async () =>
                                toggleSectionActiveAction(
                                  row.id,
                                  !row.isActive
                                ),
                              row.isActive ? "Deactivated" : "Activated"
                            )
                          }
                        >
                          {row.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          disabled={!row.canDelete}
                          className={cn(
                            buttonVariants({
                              variant: "destructive",
                              size: "sm",
                            })
                          )}
                          onClick={() =>
                            run(
                              async () => deleteSectionAction(row.id),
                              "Section deleted"
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
