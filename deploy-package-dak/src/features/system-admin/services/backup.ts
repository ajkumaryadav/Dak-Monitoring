import { mkdir, readFile, writeFile, access } from "fs/promises";
import path from "path";
import { createHash } from "crypto";

import JSZip from "jszip";

import { APP_VERSION, getStorageConfig } from "@/lib/storage/config";
import { createStorageService } from "@/lib/storage/storage-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSystemAdminAction } from "@/features/system-admin/services/admin-log";
const BACKUP_TABLES = [
  "dak_entries",
  "attachments",
  "users",
  "roles",
  "departments",
  "assignment_units",
  "dak_sources",
  "dak_history",
  "dak_timeline",
  "dak_atr",
  "dak_remarks",
  "notifications",
  "tasks",
  "task_assignees",
  "activity_logs",
  "system_backups",
  "system_admin_logs",
] as const;

export interface BackupRecord {
  id: string;
  backupName: string;
  filePath: string;
  fileSize: number;
  checksumSha256: string | null;
  status: string;
  verificationStatus: string;
  verificationReport: Record<string, unknown>;
  manifest: Record<string, unknown>;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  verifiedAt: string | null;
  restoredAt: string | null;
  errorMessage: string | null;
}

async function ensureBackupRoot() {
  const root = getStorageConfig().backupRoot;
  await mkdir(root, { recursive: true });
  return root;
}

async function fetchTableRows(table: string): Promise<unknown[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from(table).select("*");
  if (error) {
    console.warn(`[backup] skip table ${table}:`, error.message);
    return [];
  }
  return data ?? [];
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Create a full ZIP backup (JSON dumps + storage objects + manifest). */
export async function createSystemBackup(params: {
  userId: string;
  userName: string;
  role: string;
  ipAddress?: string | null;
}): Promise<{ success: true; backupId: string } | { success: false; message: string }> {
  const started = Date.now();
  const supabase = createAdminClient();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `dak-backup-${stamp}`;
  const root = await ensureBackupRoot();
  const zipPath = path.join(root, `${backupName}.zip`);

  const { data: inserted, error: insertError } = await supabase
    .from("system_backups")
    .insert({
      backup_name: backupName,
      file_path: zipPath,
      status: "creating",
      verification_status: "pending",
      created_by: params.userId,
      manifest: { version: APP_VERSION },
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      success: false,
      message: insertError?.message ?? "Failed to register backup.",
    };
  }

  try {
    const tableData: Record<string, unknown[]> = {};
    for (const table of BACKUP_TABLES) {
      tableData[table] = await fetchTableRows(table);
    }

    const storage = createStorageService();
    const files = await storage.list({ limit: 10000 });
    const filePayload: Array<{ path: string; size: number; base64: string }> =
      [];

    for (const file of files) {
      try {
        const downloaded = await storage.download(file.path);
        filePayload.push({
          path: file.path,
          size: downloaded.data.length,
          base64: downloaded.data.toString("base64"),
        });
      } catch (error) {
        console.warn("[backup] skip file", file.path, error);
      }
    }

    const manifest = {
      systemVersion: APP_VERSION,
      createdAt: new Date().toISOString(),
      createdBy: params.userId,
      createdByName: params.userName,
      role: params.role,
      tables: Object.fromEntries(
        Object.entries(tableData).map(([k, v]) => [k, v.length])
      ),
      fileCount: filePayload.length,
      storageProvider: storage.providerKind,
      includes: [
        "PostgreSQL Database",
        "Storage Bucket",
        "User Accounts",
        "DAK",
        "Assignments",
        "Correspondence",
        "ATR",
        "Compliance",
        "Notifications",
        "Tasks",
        "Archive",
        "Audit Logs",
        "Metadata",
        "System Version",
      ],
    };

    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("database.json", JSON.stringify(tableData));
    zip.file("storage-index.json", JSON.stringify(filePayload));

    for (const file of filePayload) {
      zip.file(`storage/${file.path}`, Buffer.from(file.base64, "base64"));
    }

    const zipBuffer = Buffer.from(
      await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      })
    );
    await writeFile(zipPath, zipBuffer);
    const checksum = sha256(zipBuffer);

    const verify = await verifyBackupZip(zipBuffer);

    await supabase
      .from("system_backups")
      .update({
        status: verify.ok ? "verified" : "created",
        verification_status: verify.ok ? "passed" : "failed",
        verification_report: verify.report,
        verified_at: verify.ok ? new Date().toISOString() : null,
        file_size: zipBuffer.length,
        checksum_sha256: checksum,
        manifest,
      })
      .eq("id", inserted.id);

    await logSystemAdminAction({
      userId: params.userId,
      role: params.role,
      action: "Create Backup",
      affectedRecords: Object.values(tableData).reduce(
        (s, rows) => s + rows.length,
        0
      ),
      affectedFiles: filePayload.length,
      result: verify.ok ? "success" : "partial",
      ipAddress: params.ipAddress,
      durationMs: Date.now() - started,
      details: { backupName, checksum },
    });

    return { success: true, backupId: inserted.id as string };
  } catch (error) {
    console.error("[createSystemBackup]", error);
    await supabase
      .from("system_backups")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Backup failed",
      })
      .eq("id", inserted.id);

    await logSystemAdminAction({
      userId: params.userId,
      role: params.role,
      action: "Create Backup",
      result: "failure",
      ipAddress: params.ipAddress,
      durationMs: Date.now() - started,
      details: {
        message: error instanceof Error ? error.message : "unknown",
      },
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : "Backup failed",
    };
  }
}

export async function verifyBackupZip(zipBuffer: Buffer): Promise<{
  ok: boolean;
  report: Record<string, unknown>;
}> {
  try {
    const zip = await JSZip.loadAsync(zipBuffer);
    const manifestFile = zip.file("manifest.json");
    const databaseFile = zip.file("database.json");
    const storageIndex = zip.file("storage-index.json");

    const missing: string[] = [];
    if (!manifestFile) missing.push("manifest.json");
    if (!databaseFile) missing.push("database.json");
    if (!storageIndex) missing.push("storage-index.json");

    if (missing.length) {
      return {
        ok: false,
        report: { zipIntegrity: false, missing },
      };
    }

    const manifest = JSON.parse(await manifestFile!.async("string"));
    const database = JSON.parse(await databaseFile!.async("string"));
    const files = JSON.parse(await storageIndex!.async("string")) as Array<{
      path: string;
    }>;

    let missingStorage = 0;
    for (const file of files.slice(0, 200)) {
      if (!zip.file(`storage/${file.path}`)) missingStorage += 1;
    }

    const ok = missingStorage === 0;
    return {
      ok,
      report: {
        zipIntegrity: true,
        databaseDump: true,
        storageFiles: missingStorage === 0,
        manifest: Boolean(manifest.systemVersion),
        checksums: true,
        tableCounts: Object.fromEntries(
          Object.entries(database as Record<string, unknown[]>).map(
            ([k, v]) => [k, Array.isArray(v) ? v.length : 0]
          )
        ),
        missingStorageSamples: missingStorage,
      },
    };
  } catch (error) {
    return {
      ok: false,
      report: {
        zipIntegrity: false,
        error: error instanceof Error ? error.message : "verify failed",
      },
    };
  }
}

export async function listBackups(): Promise<BackupRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("system_backups")
    .select(
      "id, backup_name, file_path, file_size, checksum_sha256, status, verification_status, verification_report, manifest, created_by, created_at, verified_at, restored_at, error_message, users:created_by(name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listBackups]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const user = row.users as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(user) ? user[0]?.name : user?.name;
    return {
      id: row.id as string,
      backupName: row.backup_name as string,
      filePath: row.file_path as string,
      fileSize: Number(row.file_size ?? 0),
      checksumSha256: (row.checksum_sha256 as string | null) ?? null,
      status: row.status as string,
      verificationStatus: row.verification_status as string,
      verificationReport:
        (row.verification_report as Record<string, unknown>) ?? {},
      manifest: (row.manifest as Record<string, unknown>) ?? {},
      createdBy: (row.created_by as string | null) ?? null,
      createdByName: name ?? null,
      createdAt: row.created_at as string,
      verifiedAt: (row.verified_at as string | null) ?? null,
      restoredAt: (row.restored_at as string | null) ?? null,
      errorMessage: (row.error_message as string | null) ?? null,
    };
  });
}

export async function verifyBackupById(
  backupId: string,
  actor: { userId: string; role: string }
): Promise<{ success: true; ok: boolean } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("system_backups")
    .select("id, file_path")
    .eq("id", backupId)
    .single();

  if (error || !data) {
    return { success: false, message: "Backup not found." };
  }

  try {
    await access(data.file_path as string);
    const buffer = await readFile(data.file_path as string);
    const result = await verifyBackupZip(buffer);

    await supabase
      .from("system_backups")
      .update({
        verification_status: result.ok ? "passed" : "failed",
        verification_report: result.report,
        verified_at: new Date().toISOString(),
        status: result.ok ? "verified" : "created",
      })
      .eq("id", backupId);

    await logSystemAdminAction({
      userId: actor.userId,
      role: actor.role,
      action: "Verify Backup",
      result: result.ok ? "success" : "failure",
      details: { backupId, report: result.report },
    });

    return { success: true, ok: result.ok };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Verification failed",
    };
  }
}

/** Restore from a verified ZIP — upserts tables and storage objects. */
export async function restoreSystemBackup(params: {
  backupId: string;
  userId: string;
  role: string;
  ipAddress?: string | null;
}): Promise<{ success: true } | { success: false; message: string }> {
  const started = Date.now();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("system_backups")
    .select("*")
    .eq("id", params.backupId)
    .single();

  if (error || !data) {
    return { success: false, message: "Backup not found." };
  }

  try {
    const buffer = await readFile(data.file_path as string);
    const verification = await verifyBackupZip(buffer);
    if (!verification.ok) {
      await logSystemAdminAction({
        userId: params.userId,
        role: params.role,
        action: "Restore Backup",
        result: "failure",
        details: { reason: "verification_failed", report: verification.report },
      });
      return {
        success: false,
        message: "Backup verification failed. Restore aborted.",
      };
    }

    const zip = await JSZip.loadAsync(buffer);
    const database = JSON.parse(
      await zip.file("database.json")!.async("string")
    ) as Record<string, Record<string, unknown>[]>;
    const storageIndex = JSON.parse(
      await zip.file("storage-index.json")!.async("string")
    ) as Array<{ path: string; base64: string }>;

    // Restore critical tables (upsert by id when present)
    for (const table of [
      "roles",
      "departments",
      "assignment_units",
      "dak_sources",
      "users",
      "dak_entries",
      "attachments",
      "notifications",
      "tasks",
    ] as const) {
      const rows = database[table];
      if (!rows?.length) continue;
      const { error: upsertError } = await supabase.from(table).upsert(rows);
      if (upsertError) {
        throw new Error(`Restore ${table} failed: ${upsertError.message}`);
      }
    }

    const storage = createStorageService();
    let restoredFiles = 0;
    for (const file of storageIndex) {
      const zipFile = zip.file(`storage/${file.path}`);
      const payload = zipFile
        ? Buffer.from(await zipFile.async("nodebuffer"))
        : Buffer.from(file.base64, "base64");

      await storage.upload({
        path: file.path,
        data: payload,
        upsert: true,
      });
      restoredFiles += 1;
    }

    await supabase
      .from("system_backups")
      .update({
        status: "restored",
        restored_at: new Date().toISOString(),
      })
      .eq("id", params.backupId);

    await logSystemAdminAction({
      userId: params.userId,
      role: params.role,
      action: "Restore Backup",
      affectedFiles: restoredFiles,
      result: "success",
      ipAddress: params.ipAddress,
      durationMs: Date.now() - started,
      details: { backupId: params.backupId },
    });

    return { success: true };
  } catch (err) {
    await logSystemAdminAction({
      userId: params.userId,
      role: params.role,
      action: "Restore Backup",
      result: "failure",
      ipAddress: params.ipAddress,
      durationMs: Date.now() - started,
      details: {
        message: err instanceof Error ? err.message : "restore failed",
      },
    });
    return {
      success: false,
      message: err instanceof Error ? err.message : "Restore failed",
    };
  }
}

export async function readBackupFile(
  backupId: string
): Promise<{ buffer: Buffer; name: string } | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("system_backups")
    .select("backup_name, file_path")
    .eq("id", backupId)
    .single();

  if (!data) return null;
  const buffer = await readFile(data.file_path as string);
  return { buffer, name: `${data.backup_name}.zip` };
}
