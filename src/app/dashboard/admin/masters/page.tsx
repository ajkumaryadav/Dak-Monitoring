import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { MastersConsole } from "@/features/masters/components/masters-console";
import { canManageMasters } from "@/features/masters/lib/permissions";
import {
  listDepartmentsMaster,
  listSectionsMaster,
} from "@/features/masters/services/master-service";
import { PERMISSIONS, requirePermission } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MastersAdminPage() {
  await requirePermission(PERMISSIONS.MASTERS);
  const user = await getSessionUser();
  if (!user || !canManageMasters(user.role)) {
    redirect("/dashboard");
  }

  const [departments, sections] = await Promise.all([
    listDepartmentsMaster(true),
    listSectionsMaster(true),
  ]);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Department & Section Master"
        description="Manage district departments and internal Collectorate sections. Changes sync immediately to assignment, onboarding, filters, and reports."
        icon={Building2}
      />
      <MastersConsole departments={departments} sections={sections} />
    </div>
  );
}
