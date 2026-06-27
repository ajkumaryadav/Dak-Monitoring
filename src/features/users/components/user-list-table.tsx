import Link from "next/link";

import type { UserListRecord } from "@/features/users/services/get-users";
import { Badge } from "@/components/ui/badge";
import { getRoleLabel } from "@/features/users/lib/role-labels";
import type { UserRole } from "@/types";

interface UserListTableProps {
  users: UserListRecord[];
}

function mapSlug(slug: string): UserRole {
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

export function UserListTable({ users }: UserListTableProps) {
  if (!users.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No users found. Create the first user account.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Department / Section</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </td>
              <td className="px-4 py-3 capitalize">
                {getRoleLabel(mapSlug(user.roleSlug))}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {user.departmentName ?? "—"}
                {user.sectionName ? ` / ${user.sectionName}` : ""}
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Disabled"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/admin/users/${user.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Manage
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
