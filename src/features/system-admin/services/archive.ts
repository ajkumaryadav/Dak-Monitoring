import { createAdminClient } from "@/lib/supabase/admin";
import { logSystemAdminAction } from "@/features/system-admin/services/admin-log";

export type ArchivePeriodYears = 1 | 2 | 3;

/** Soft-archive closed/completed DAK older than N years. */
export async function archiveOldDak(params: {
  years: ArchivePeriodYears;
  userId: string;
  role: string;
}): Promise<
  | { success: true; archivedCount: number }
  | { success: false; message: string }
> {
  const started = Date.now();
  const supabase = createAdminClient();
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - params.years);
  const cutoffIso = cutoff.toISOString();

  const { data: candidates, error } = await supabase
    .from("dak_entries")
    .select("id")
    .is("deleted_at", null)
    .is("archived_at", null)
    .in("status", ["completed", "closed", "disposed"])
    .lt("created_at", cutoffIso);

  if (error) {
    return { success: false, message: error.message };
  }

  const ids = (candidates ?? []).map((row) => row.id as string);
  if (!ids.length) {
    return { success: true, archivedCount: 0 };
  }

  const { error: updateError } = await supabase
    .from("dak_entries")
    .update({
      archived_at: new Date().toISOString(),
      archived_by: params.userId,
      archive_period_years: params.years,
    })
    .in("id", ids);

  if (updateError) {
    await logSystemAdminAction({
      userId: params.userId,
      role: params.role,
      action: "Archive DAK",
      result: "failure",
      durationMs: Date.now() - started,
      details: { message: updateError.message },
    });
    return { success: false, message: updateError.message };
  }

  await logSystemAdminAction({
    userId: params.userId,
    role: params.role,
    action: "Archive DAK",
    affectedRecords: ids.length,
    result: "success",
    durationMs: Date.now() - started,
    details: { years: params.years, ids: ids.slice(0, 50) },
  });

  return { success: true, archivedCount: ids.length };
}

/** Restore archived DAK into the active database. */
export async function restoreArchivedDak(params: {
  dakIds: string[];
  userId: string;
  role: string;
}): Promise<{ success: true; count: number } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dak_entries")
    .update({
      archived_at: null,
      archived_by: null,
      archive_period_years: null,
    })
    .in("id", params.dakIds)
    .not("archived_at", "is", null)
    .select("id");

  if (error) {
    return { success: false, message: error.message };
  }

  const restoredCount = data?.length ?? 0;

  await logSystemAdminAction({
    userId: params.userId,
    role: params.role,
    action: "Restore Archived DAK",
    affectedRecords: restoredCount,
    result: "success",
    details: { dakIds: params.dakIds },
  });

  return { success: true, count: restoredCount };
}

export async function listArchivedDak(limit = 50) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dak_entries")
    .select("id, dak_number, subject, status, archived_at, archive_period_years, created_at")
    .not("archived_at", "is", null)
    .is("deleted_at", null)
    .order("archived_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[listArchivedDak]", error.message);
    return [];
  }

  return data ?? [];
}
