import { createAdminClient } from "@/lib/supabase/admin";
import { createStorageService } from "@/lib/storage/storage-service";
import { logSystemAdminAction } from "@/features/system-admin/services/admin-log";

export interface OrphanReport {
  orphanDbRecords: Array<{ table: string; id: string; reason: string }>;
  orphanFiles: Array<{ path: string; size: number }>;
  recoverableBytes: number;
}

/** Preview orphan attachment rows and storage objects. */
export async function previewOrphans(): Promise<OrphanReport> {
  const supabase = createAdminClient();
  const storage = createStorageService();

  const { data: attachments } = await supabase
    .from("attachments")
    .select("id, dak_id, file_path, file_size");

  const { data: daks } = await supabase.from("dak_entries").select("id");
  const dakIds = new Set((daks ?? []).map((d) => d.id as string));

  const orphanDbRecords: OrphanReport["orphanDbRecords"] = [];
  const referencedPaths = new Set<string>();

  for (const row of attachments ?? []) {
    const dakId = row.dak_id as string | null;
    const filePath = row.file_path as string;
    if (filePath) referencedPaths.add(filePath);

    if (!dakId || !dakIds.has(dakId)) {
      orphanDbRecords.push({
        table: "attachments",
        id: row.id as string,
        reason: "Missing parent dak_entries row",
      });
    }
  }

  let storageObjects: Array<{ path: string; size: number }> = [];
  try {
    storageObjects = (await storage.list({ limit: 10000 })).map((o) => ({
      path: o.path,
      size: o.size,
    }));
  } catch (error) {
    console.error("[previewOrphans] list", error);
  }

  const orphanFiles = storageObjects.filter(
    (obj) => !referencedPaths.has(obj.path)
  );

  return {
    orphanDbRecords,
    orphanFiles,
    recoverableBytes: orphanFiles.reduce((s, f) => s + f.size, 0),
  };
}

/** Clean orphan DB rows and storage files after preview confirmation. */
export async function cleanOrphans(params: {
  userId: string;
  role: string;
}): Promise<
  | { success: true; report: OrphanReport; cleanedDb: number; cleanedFiles: number }
  | { success: false; message: string }
> {
  const started = Date.now();
  const preview = await previewOrphans();
  const supabase = createAdminClient();
  const storage = createStorageService();

  try {
    if (preview.orphanDbRecords.length) {
      const ids = preview.orphanDbRecords.map((r) => r.id);
      await supabase.from("attachments").delete().in("id", ids);
    }

    if (preview.orphanFiles.length) {
      await storage.remove(preview.orphanFiles.map((f) => f.path));
    }

    await supabase.from("orphan_cleanup_reports").insert({
      report_type: "clean",
      orphan_db_count: preview.orphanDbRecords.length,
      orphan_file_count: preview.orphanFiles.length,
      recoverable_bytes: preview.recoverableBytes,
      report: preview,
      created_by: params.userId,
    });

    await logSystemAdminAction({
      userId: params.userId,
      role: params.role,
      action: "Orphan Cleaner",
      affectedRecords: preview.orphanDbRecords.length,
      affectedFiles: preview.orphanFiles.length,
      result: "success",
      durationMs: Date.now() - started,
      details: { recoverableBytes: preview.recoverableBytes },
    });

    return {
      success: true,
      report: preview,
      cleanedDb: preview.orphanDbRecords.length,
      cleanedFiles: preview.orphanFiles.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Clean failed",
    };
  }
}
