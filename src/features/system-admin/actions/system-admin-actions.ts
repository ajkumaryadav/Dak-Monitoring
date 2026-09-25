"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

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
import { formatSafeErrorMessage, logSafeError } from "@/lib/security/errors";

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
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };

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
  } catch (err: unknown) {
    logSafeError("getDatabaseStorageOverviewAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to load database overview.") };
  }
}

export async function createBackupAction() {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };

    const result = await createSystemBackup({
      userId: user.id,
      userName: user.name,
      role: user.role,
    });
    revalidateAdmin();
    return result;
  } catch (err: unknown) {
    logSafeError("createBackupAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to create backup.") };
  }
}

export async function verifyBackupAction(backupId: string) {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid backup ID").safeParse(backupId);
    if (!validId.success) {
      return { success: false as const, message: "Invalid backup identifier." };
    }
    const result = await verifyBackupById(backupId, {
      userId: user.id,
      role: user.role,
    });
    revalidateAdmin();
    return result;
  } catch (err: unknown) {
    logSafeError("verifyBackupAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to verify backup.") };
  }
}

export async function restoreBackupAction(backupId: string, confirmation: string) {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid backup ID").safeParse(backupId);
    if (!validId.success) {
      return { success: false as const, message: "Invalid backup identifier." };
    }
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
  } catch (err: unknown) {
    logSafeError("restoreBackupAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to restore backup.") };
  }
}

export async function downloadBackupAction(backupId: string) {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid backup ID").safeParse(backupId);
    if (!validId.success) {
      return { success: false as const, message: "Invalid backup identifier." };
    }

    const file = await readBackupFile(backupId);
    if (!file) return { success: false as const, message: "Backup file missing." };

    return {
      success: true as const,
      fileName: file.name,
      base64: file.buffer.toString("base64"),
    };
  } catch (err: unknown) {
    logSafeError("downloadBackupAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to download backup.") };
  }
}

export async function archiveDakAction(years: 1 | 2 | 3) {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    if (![1, 2, 3].includes(years)) {
      return { success: false as const, message: "Invalid archive period." };
    }
    const result = await archiveOldDak({
      years,
      userId: user.id,
      role: user.role,
    });
    revalidateAdmin();
    return result;
  } catch (err: unknown) {
    logSafeError("archiveDakAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to archive DAK records.") };
  }
}

export async function restoreArchivedAction(dakIds: string[]) {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const parsed = z.array(z.string().uuid()).max(500).safeParse(dakIds);
    if (!parsed.success) {
      return { success: false as const, message: "Invalid record selection." };
    }
    const result = await restoreArchivedDak({
      dakIds: parsed.data,
      userId: user.id,
      role: user.role,
    });
    revalidateAdmin();
    return result;
  } catch (err: unknown) {
    logSafeError("restoreArchivedAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to restore archived records.") };
  }
}

export async function restoreRecycleAction(dakId: string) {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid DAK ID").safeParse(dakId);
    if (!validId.success) {
      return { success: false as const, message: "Invalid DAK identifier." };
    }
    const result = await restoreFromRecycleBin({
      dakId,
      userId: user.id,
      role: user.role,
    });
    revalidateAdmin();
    return result;
  } catch (err: unknown) {
    logSafeError("restoreRecycleAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to restore record.") };
  }
}

export async function permanentDeleteAction(
  dakId: string,
  confirmation: string
) {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    if (!canPermanentlyDeleteDak(user.role)) {
      return {
        success: false as const,
        message: "Only ACP can permanently delete a DAK.",
      };
    }
    const validId = z.string().uuid("Invalid DAK ID").safeParse(dakId);
    if (!validId.success) {
      return { success: false as const, message: "Invalid DAK identifier." };
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
  } catch (err: unknown) {
    logSafeError("permanentDeleteAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to permanently delete DAK.") };
  }
}

export async function getDakDeletionInventoryAction(dakId: string) {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid DAK ID").safeParse(dakId);
    if (!validId.success) {
      return { success: false as const, message: "Invalid DAK identifier." };
    }
    const inventory = await getDakDeletionInventory(dakId);
    if (!inventory) {
      return { success: false as const, message: "DAK not found." };
    }
    return { success: true as const, inventory };
  } catch (err: unknown) {
    logSafeError("getDakDeletionInventoryAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to fetch deletion inventory.") };
  }
}

export async function previewOrphansAction() {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const report = await previewOrphans();
    return { success: true as const, report };
  } catch (err: unknown) {
    logSafeError("previewOrphansAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to preview orphans.") };
  }
}

export async function cleanOrphansAction(confirmation: string) {
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    if (confirmation.trim().toUpperCase() !== "DELETE") {
      return {
        success: false as const,
        message: 'Type DELETE to clean orphan records/files.',
      };
    }
    const result = await cleanOrphans({ userId: user.id, role: user.role });
    revalidateAdmin();
    return result;
  } catch (err: unknown) {
    logSafeError("cleanOrphansAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to clean orphans.") };
  }
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
  try {
    const user = await requireActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validOps = ["vacuum", "analyze", "reindex", "cleanup_logs", "cleanup_temp", "refresh_stats"];
    if (!validOps.includes(operation)) {
      return { success: false as const, message: "Invalid maintenance operation." };
    }
    const result = await runMaintenance({
      operation,
      userId: user.id,
      role: user.role,
    });
    revalidateAdmin();
    return result;
  } catch (err: unknown) {
    logSafeError("runMaintenanceAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to run maintenance.") };
  }
}
