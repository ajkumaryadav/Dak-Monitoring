"use server";

import { revalidatePath } from "next/cache";

import {
  canAccessDatabaseStorage,
  canPermanentlyDeleteDak,
} from "@/features/system-admin/lib/permissions";
import { archiveOldDak, restoreArchivedDak } from "@/features/system-admin/services/archive";
import {
  createSystemBackup,
  listBackups,
  readBackupFile,
  restoreSystemBackup,
  verifyBackupById,
} from "@/features/system-admin/services/backup";
import { getDakDeletionInventory } from "@/features/system-admin/services/dak-inventory";
import { runMaintenance } from "@/features/system-admin/services/maintenance";
import {
  cleanOrphans,
  previewOrphans,
} from "@/features/system-admin/services/orphan-cleaner";
import {
  listRecycleBin,
  permanentlyDeleteDak,
  restoreFromRecycleBin,
} from "@/features/system-admin/services/recycle-bin";
import {
  fetchDatabaseStats,
  fetchStorageStats,
} from "@/features/system-admin/services/stats";
import { getSessionUser } from "@/lib/session";

async function requireActor() {
  const user = await getSessionUser();
  if (!user || !canAccessDatabaseStorage(user.role)) {
    return null;
  }
  return user;
}

function revalidateAdmin() {
  revalidatePath("/dashboard/admin/database-storage");
  revalidatePath("/dashboard");
}

export async function getDatabaseStorageOverviewAction() {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };

  const [database, storage, backups, recycleBin] = await Promise.all([
    fetchDatabaseStats(),
    fetchStorageStats(),
    listBackups(),
    listRecycleBin(),
  ]);

  return {
    success: true as const,
    database,
    storage,
    backups,
    recycleBin,
  };
}

export async function createBackupAction() {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };

  const result = await createSystemBackup({
    userId: user.id,
    userName: user.name,
    role: user.role,
  });
  revalidateAdmin();
  return result;
}

export async function verifyBackupAction(backupId: string) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await verifyBackupById(backupId, {
    userId: user.id,
    role: user.role,
  });
  revalidateAdmin();
  return result;
}

export async function restoreBackupAction(backupId: string, confirmation: string) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  if (confirmation.trim().toUpperCase() !== "RESTORE") {
    return {
      success: false as const,
      message: 'Type RESTORE to confirm restoration.',
    };
  }

  const result = await restoreSystemBackup({
    backupId,
    userId: user.id,
    role: user.role,
  });
  revalidateAdmin();
  return result;
}

export async function downloadBackupAction(backupId: string) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };

  const file = await readBackupFile(backupId);
  if (!file) return { success: false as const, message: "Backup file missing." };

  return {
    success: true as const,
    fileName: file.name,
    base64: file.buffer.toString("base64"),
  };
}

export async function archiveDakAction(years: 1 | 2 | 3) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await archiveOldDak({
    years,
    userId: user.id,
    role: user.role,
  });
  revalidateAdmin();
  return result;
}

export async function restoreArchivedAction(dakIds: string[]) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await restoreArchivedDak({
    dakIds,
    userId: user.id,
    role: user.role,
  });
  revalidateAdmin();
  return result;
}

export async function restoreRecycleAction(dakId: string) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await restoreFromRecycleBin({
    dakId,
    userId: user.id,
    role: user.role,
  });
  revalidateAdmin();
  return result;
}

export async function permanentDeleteAction(
  dakId: string,
  confirmation: string
) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  if (!canPermanentlyDeleteDak(user.role)) {
    return {
      success: false as const,
      message: "Only ACP can permanently delete a DAK.",
    };
  }
  if (confirmation.trim().toUpperCase() !== "DELETE") {
    return {
      success: false as const,
      message: "Type DELETE to confirm permanent deletion.",
    };
  }

  const result = await permanentlyDeleteDak({
    dakId,
    userId: user.id,
    role: user.role,
  });
  revalidateAdmin();
  return result;
}

export async function getDakDeletionInventoryAction(dakId: string) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const inventory = await getDakDeletionInventory(dakId);
  if (!inventory) {
    return { success: false as const, message: "DAK not found." };
  }
  return { success: true as const, inventory };
}

export async function previewOrphansAction() {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const report = await previewOrphans();
  return { success: true as const, report };
}

export async function cleanOrphansAction(confirmation: string) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  if (confirmation.trim().toUpperCase() !== "DELETE") {
    return {
      success: false as const,
      message: 'Type DELETE to clean orphan records/files.',
    };
  }
  const result = await cleanOrphans({ userId: user.id, role: user.role });
  revalidateAdmin();
  return result;
}

export async function runMaintenanceAction(
  operation:
    | "vacuum"
    | "analyze"
    | "reindex"
    | "cleanup_logs"
    | "cleanup_temp"
    | "refresh_stats"
) {
  const user = await requireActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await runMaintenance({
    operation,
    userId: user.id,
    role: user.role,
  });
  revalidateAdmin();
  return result;
}
