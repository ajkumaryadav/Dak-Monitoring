import { createAdminClient } from "@/lib/supabase/admin";
import { createStorageService } from "@/lib/storage/storage-service";
import { logSystemAdminAction } from "@/features/system-admin/services/admin-log";

export interface RecycleBinEntry {
  id: string;
  dakNumber: string;
  subject: string;
  deletedAt: string;
  deletedBy: string | null;
  deletedByName: string | null;
  sizeBytes: number;
}

/** Soft-delete DAK into Recycle Bin (preserves related rows). */
export async function moveDakToRecycleBin(params: {
  dakId: string;
  userId: string;
  role: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("dak_entries")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: params.userId,
    })
    .eq("id", params.dakId)
    .is("deleted_at", null);

  if (error) {
    return { success: false, message: error.message };
  }

  await logSystemAdminAction({
    userId: params.userId,
    role: params.role,
    action: "Move to Recycle Bin",
    affectedRecords: 1,
    result: "success",
    details: { dakId: params.dakId },
  });

  return { success: true };
}

export async function listRecycleBin(): Promise<RecycleBinEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, deleted_at, deleted_by, users:deleted_by(name), attachments(file_size)"
    )
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("[listRecycleBin]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const user = row.users as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(user) ? user[0]?.name : user?.name;
    const attachments = (row.attachments ?? []) as Array<{ file_size?: number }>;
    const sizeBytes = attachments.reduce(
      (sum, a) => sum + Number(a.file_size ?? 0),
      0
    );

    return {
      id: row.id as string,
      dakNumber: row.dak_number as string,
      subject: row.subject as string,
      deletedAt: row.deleted_at as string,
      deletedBy: (row.deleted_by as string | null) ?? null,
      deletedByName: name ?? null,
      sizeBytes,
    };
  });
}

export async function restoreFromRecycleBin(params: {
  dakId: string;
  userId: string;
  role: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("dak_entries")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", params.dakId);

  if (error) return { success: false, message: error.message };

  await logSystemAdminAction({
    userId: params.userId,
    role: params.role,
    action: "Restore from Recycle Bin",
    affectedRecords: 1,
    result: "success",
    details: { dakId: params.dakId },
  });

  return { success: true };
}

/**
 * Permanent delete — removes DAK and every associated record/file.
 * Designed for transactional integrity (best-effort with ordered cleanup).
 */
export async function permanentlyDeleteDak(params: {
  dakId: string;
  userId: string;
  role: string;
}): Promise<
  | { success: true; freedBytes: number; deletedFiles: number }
  | { success: false; message: string }
> {
  const started = Date.now();
  const supabase = createAdminClient();
  const storage = createStorageService();

  const [{ data: attachments }, { data: atrRows }] = await Promise.all([
    supabase
      .from("attachments")
      .select("id, file_path, file_size, storage_bucket")
      .eq("dak_id", params.dakId),
    supabase
      .from("dak_atr")
      .select("attachment_file_path")
      .eq("dak_id", params.dakId),
  ]);

  const files = attachments ?? [];
  const pathSet = new Set<string>();
  for (const f of files) {
    const path = f.file_path as string | null;
    if (path) pathSet.add(path);
  }
  for (const row of atrRows ?? []) {
    const path = row.attachment_file_path as string | null;
    if (path) pathSet.add(path);
  }
  const paths = [...pathSet];
  const freedBytes = files.reduce(
    (sum, f) => sum + Number(f.file_size ?? 0),
    0
  );

  try {
    if (paths.length) {
      await storage.remove(paths);
    }

    // Child tables that reference dak_id (best-effort cascade)
    const childTables = [
      "attachments",
      "dak_remarks",
      "dak_atr",
      "dak_history",
      "dak_timeline",
      "notifications",
      "dak_requests",
      "clarification_requests",
      "compliance_drafts",
      "dak_transfers",
    ] as const;

    for (const table of childTables) {
      const { error } = await supabase.from(table).delete().eq("dak_id", params.dakId);
      if (error) {
        console.warn(`[permanentDelete] ${table}:`, error.message);
      }
    }

    // Tasks linked by dak_id if present
    await supabase.from("tasks").delete().eq("dak_id", params.dakId);

    const { error: dakError } = await supabase
      .from("dak_entries")
      .delete()
      .eq("id", params.dakId);

    if (dakError) {
      throw new Error(dakError.message);
    }

    await logSystemAdminAction({
      userId: params.userId,
      role: params.role,
      action: "Permanent Delete DAK",
      affectedRecords: 1,
      affectedFiles: paths.length,
      result: "success",
      durationMs: Date.now() - started,
      details: { dakId: params.dakId, freedBytes },
    });

    return { success: true, freedBytes, deletedFiles: paths.length };
  } catch (error) {
    await logSystemAdminAction({
      userId: params.userId,
      role: params.role,
      action: "Permanent Delete DAK",
      result: "failure",
      durationMs: Date.now() - started,
      details: {
        dakId: params.dakId,
        message: error instanceof Error ? error.message : "failed",
      },
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Permanent delete failed",
    };
  }
}
