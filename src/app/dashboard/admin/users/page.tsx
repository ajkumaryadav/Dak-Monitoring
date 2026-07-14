import Link from "next/link";
import { UserPlus, Users } from "lucide-react";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { UserFlashBanner } from "@/features/users/components/user-flash-banner";
import { UserListTable } from "@/features/users/components/user-list-table";
import { getUsersList } from "@/features/users/services/get-users";
import { buttonVariants } from "@/components/ui/button";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AdminUsersPageProps {
  searchParams: Promise<{ created?: string; updated?: string }>;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  await requirePermission(PERMISSIONS.USERS);
  const params = await searchParams;
  const users = await getUsersList();

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="User Management"
        description="Create, edit, and manage district user accounts, roles, and department/section mapping."
        icon={Users}
      />

      <UserFlashBanner
        created={params.created === "1"}
        updated={params.updated === "1"}
      />

      <div className="flex justify-end">
        <Link
          href="/dashboard/admin/users/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <UserPlus className="size-4" />
          New User
        </Link>
      </div>

      <UserListTable users={users} />
    </div>
  );
}
