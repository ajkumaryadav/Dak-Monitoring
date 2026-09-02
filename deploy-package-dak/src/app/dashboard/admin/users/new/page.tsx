import { UserPlus } from "lucide-react";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { UserForm } from "@/features/users/components/user-form";
import { getUserFormOptions } from "@/features/users/services/get-user-form-options";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requirePermission(PERMISSIONS.USERS);
  const options = await getUserFormOptions();

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Create User"
        description="Register a new district user with role, department, and section assignment."
        icon={UserPlus}
      />

      <div className="overflow-hidden rounded-2xl border bg-background p-5 shadow-sm md:p-6">
        <UserForm mode="create" options={options} />
      </div>
    </div>
  );
}
