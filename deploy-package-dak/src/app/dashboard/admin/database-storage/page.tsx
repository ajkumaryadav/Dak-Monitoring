import { Database } from "lucide-react";
import { redirect } from "next/navigation";

import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { SystemAdminConsole } from "@/features/system-admin/components/system-admin-console";
import {
  canAccessDatabaseStorage,
  canPermanentlyDeleteDak,
} from "@/features/system-admin/lib/permissions";
import { listArchivedDak } from "@/features/system-admin/services/archive";
import { listBackups } from "@/features/system-admin/services/backup";
import { getLargestDaks } from "@/features/system-admin/services/dak-inventory";
import { listRecycleBin } from "@/features/system-admin/services/recycle-bin";
import {
  fetchDatabaseStats,
  fetchStorageStats,
} from "@/features/system-admin/services/stats";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type AdminTab =
  | "dashboard"
  | "backup"
  | "archive"
  | "recycle"
  | "storage"
  | "maintenance";

const VALID_TABS = new Set<AdminTab>([
  "dashboard",
  "backup",
  "archive",
  "recycle",
  "storage",
  "maintenance",
]);

interface DatabaseStorageAdminPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DatabaseStorageAdminPage({
  searchParams,
}: DatabaseStorageAdminPageProps) {
  await requirePermission(PERMISSIONS.DATABASE_STORAGE);
  const user = await getSessionUser();

  if (!user || !canAccessDatabaseStorage(user.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const tabParam = params.tab;
  const initialTab: AdminTab =
    tabParam && VALID_TABS.has(tabParam as AdminTab)
      ? (tabParam as AdminTab)
      : "dashboard";

  const [database, storage, backups, recycleBin, archived, largestDaks] =
    await Promise.all([
      fetchDatabaseStats(),
      fetchStorageStats(),
      listBackups(),
      listRecycleBin(),
      listArchivedDak(30),
      getLargestDaks(20),
    ]);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Database & Storage Management"
        description="Administration console for database health, backups, archives, recycle bin, storage explorer, and maintenance — Collector & ACP only."
        icon={Database}
      />

      <SystemAdminConsole
        database={database}
        storage={storage}
        backups={backups}
        recycleBin={recycleBin}
        archived={archived}
        largestDaks={largestDaks}
        canPermanentDelete={canPermanentlyDeleteDak(user.role)}
        initialTab={initialTab}
      />
    </div>
  );
}
