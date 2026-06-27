import { FilePlus2 } from "lucide-react";

import { DakEntryForm } from "@/features/dak/components/dak-entry-form";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getDepartments } from "@/features/dak/services/get-departments";
import { getDakSources } from "@/features/dak/services/get-dak-sources";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export default async function NewDakPage() {
  await requirePermission(PERMISSIONS.DAK_ENTRY);

  const [departments, sources] = await Promise.all([
    getDepartments(),
    getDakSources(),
  ]);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="New DAK Entry"
        description="Register incoming correspondence for diary entry and workflow processing."
        icon={FilePlus2}
      />
      <DakEntryForm departments={departments} sources={sources} />
    </div>
  );
}
