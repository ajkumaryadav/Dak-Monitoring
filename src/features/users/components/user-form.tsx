"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useActionState, useMemo } from "react";

import {
  createUserFormAction,
  type CreateUserFormState,
} from "@/features/users/actions/create-user";
import {
  updateUserFormAction,
  type UpdateUserFormState,
} from "@/features/users/actions/update-user";
import { getRoleLabel } from "@/features/users/lib/role-labels";
import type { UserFormOptions } from "@/features/users/services/get-user-form-options";
import type { UserDetailRecord } from "@/features/users/services/get-users";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const inputClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
);

type FormState = CreateUserFormState | UpdateUserFormState;

interface UserFormProps {
  mode: "create" | "edit";
  options: UserFormOptions;
  user?: UserDetailRecord;
}

function mapRoleSlugToAppRole(slug: string): UserRole {
  const map: Record<string, UserRole> = {
    collector: "collector",
    acp: "acp",
    adm: "adm",
    dak_operator: "dak_operator",
    department_user: "department_user",
    section_user: "section_user",
    district_officer: "department_user",
    block_officer: "department_user",
    clerk: "department_user",
    data_entry_operator: "dak_operator",
  };
  return map[slug] ?? "dak_operator";
}

export function UserForm({ mode, options, user }: UserFormProps) {
  const action = mode === "create" ? createUserFormAction : updateUserFormAction;
  const [state, formAction, isPending] = useActionState(action, {} as FormState);

  const defaultRole = user ? mapRoleSlugToAppRole(user.roleSlug) : "dak_operator";

  const roleOptions = useMemo(
    () =>
      options.roles.map((role) => ({
        value: mapRoleSlugToAppRole(role.slug),
        label: getRoleLabel(mapRoleSlugToAppRole(role.slug)),
      })),
    [options.roles]
  );

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && user && (
        <input type="hidden" name="userId" value={user.id} />
      )}

      {state.message && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <input id="name" name="name" required defaultValue={user?.name ?? ""} className={inputClassName} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <input id="email" name="email" type="email" required defaultValue={user?.email ?? ""} className={inputClassName} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mobile">Mobile</Label>
          <input id="mobile" name="mobile" defaultValue={user?.mobile ?? ""} className={inputClassName} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="designation">Designation</Label>
          <input id="designation" name="designation" required defaultValue={user?.designation ?? ""} className={inputClassName} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="employeeCode">Employee Code</Label>
          <input id="employeeCode" name="employeeCode" defaultValue={user?.employeeCode ?? ""} className={inputClassName} />
        </div>
        {mode === "create" && (
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <input id="password" name="password" type="password" required minLength={8} className={inputClassName} />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <select id="role" name="role" required defaultValue={defaultRole} className={inputClassName}>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="departmentId">Department</Label>
          <select id="departmentId" name="departmentId" defaultValue={user?.departmentId ?? ""} className={inputClassName}>
            <option value="">Select department</option>
            {options.departments.map((dept) => (
              <option key={dept.departmentId} value={dept.departmentId}>
                {dept.displayLabel}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sectionId">Section</Label>
          <select id="sectionId" name="sectionId" defaultValue={user?.sectionId ?? ""} className={inputClassName}>
            <option value="">Select section</option>
            {options.sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.unit_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={user?.isActive ?? true}
            value="true"
            className="size-4 rounded border-input"
          />
          <Label htmlFor="isActive">Active account</Label>
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <button type="submit" disabled={isPending} className={cn(buttonVariants(), "gap-2")}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {mode === "create" ? "Create User" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
