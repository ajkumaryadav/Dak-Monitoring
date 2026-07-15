import { notFound } from "next/navigation";
import { UserCog } from "lucide-react";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { canPermanentlyDeleteUser } from "@/features/system-admin/lib/permissions";
import { UserActionsPanel } from "@/features/users/components/user-actions-panel";
import { UserForm } from "@/features/users/components/user-form";
import { getUserFormOptions } from "@/features/users/services/get-user-form-options";
import { getUserById } from "@/features/users/services/get-users";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  await requirePermission(PERMISSIONS.USERS);
  const { id } = await params;
  const sessionUser = await getSessionUser();

  const [user, options] = await Promise.all([
    getUserById(id),
    getUserFormOptions(),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <DakPageHeader
        title={`Edit User — ${user.name}`}
        description="Update profile, role mapping, department/section assignment, and account status."
        icon={UserCog}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border bg-background p-5 shadow-sm md:p-6">
          <UserForm mode="edit" options={options} user={user} />
        </div>
        <UserActionsPanel
          userId={user.id}
          isActive={user.isActive}
          canPermanentlyDelete={
            sessionUser ? canPermanentlyDeleteUser(sessionUser.role) : false
          }
        />
      </div>
    </div>
  );
}
