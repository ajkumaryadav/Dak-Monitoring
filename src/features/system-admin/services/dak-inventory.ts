import { createAdminClient } from "@/lib/supabase/admin";

export interface DakDeletionInventory {
  dakId: string;
  dakNumber: string;
  subject: string;
  originalPdfs: number;
  correspondence: number;
  atrUploads: number;
  complianceReports: number;
  notesRemarks: number;
  notifications: number;
  tasks: number;
  timelineEvents: number;
  databaseRecords: number;
  storageBytes: number;
  estimatedDbBytes: number;
  attachmentBreakdown: Array<{
    fileName: string;
    filePath: string;
    fileSize: number;
    kind: string;
  }>;
}

function classifyPath(path: string, fileName: string): string {
  const hay = `${path} ${fileName}`.toLowerCase();
  if (hay.includes("atr") || hay.includes("/tasks/")) return "ATR Upload";
  if (hay.includes("compliance")) return "Compliance";
  if (hay.includes("correspondence") || hay.includes("remark")) {
    return "Correspondence";
  }
  return "Original / Attachment";
}

/** Inventory of everything that will be removed on permanent delete. */
export async function getDakDeletionInventory(
  dakId: string
): Promise<DakDeletionInventory | null> {
  const supabase = createAdminClient();

  const { data: dak } = await supabase
    .from("dak_entries")
    .select("id, dak_number, subject")
    .eq("id", dakId)
    .maybeSingle();

  if (!dak) return null;

  const [
    attachments,
    remarks,
    atr,
    notifications,
    tasks,
    timeline,
    history,
    requests,
    drafts,
  ] = await Promise.all([
    supabase
      .from("attachments")
      .select("file_name, file_path, file_size")
      .eq("dak_id", dakId),
    supabase.from("dak_remarks").select("id", { count: "exact", head: true }).eq("dak_id", dakId),
    supabase
      .from("dak_atr")
      .select("id, attachment_file_path, attachment_file_name")
      .eq("dak_id", dakId),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("dak_id", dakId),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("dak_id", dakId),
    supabase
      .from("dak_timeline")
      .select("id", { count: "exact", head: true })
      .eq("dak_id", dakId),
    supabase
      .from("dak_history")
      .select("id", { count: "exact", head: true })
      .eq("dak_id", dakId),
    supabase
      .from("dak_requests")
      .select("id", { count: "exact", head: true })
      .eq("dak_id", dakId),
    supabase
      .from("compliance_drafts")
      .select("id", { count: "exact", head: true })
      .eq("dak_id", dakId),
  ]);

  const attachmentRows = attachments.data ?? [];
  const atrRows = atr.data ?? [];

  let originalPdfs = 0;
  let correspondence = 0;
  let atrFromAttachments = 0;
  let complianceReports = 0;
  let storageBytes = 0;

  const breakdown: DakDeletionInventory["attachmentBreakdown"] = [];

  for (const row of attachmentRows) {
    const size = Number(row.file_size ?? 0);
    storageBytes += size;
    const kind = classifyPath(
      String(row.file_path ?? ""),
      String(row.file_name ?? "")
    );
    if (kind === "ATR Upload") atrFromAttachments += 1;
    else if (kind === "Compliance") complianceReports += 1;
    else if (kind === "Correspondence") correspondence += 1;
    else originalPdfs += 1;

    breakdown.push({
      fileName: String(row.file_name ?? "file"),
      filePath: String(row.file_path ?? ""),
      fileSize: size,
      kind,
    });
  }

  const atrUploads = Math.max(atrRows.length, atrFromAttachments);

  const notesRemarks = remarks.count ?? 0;
  const notificationCount = notifications.count ?? 0;
  const taskCount = tasks.count ?? 0;
  const timelineCount = timeline.count ?? 0;
  const historyCount = history.count ?? 0;
  const requestCount = requests.count ?? 0;
  const draftCount = drafts.count ?? 0;

  const databaseRecords =
    1 +
    attachmentRows.length +
    notesRemarks +
    atrRows.length +
    notificationCount +
    taskCount +
    timelineCount +
    historyCount +
    requestCount +
    draftCount;

  // Rough DB estimate (~2KB per metadata row + payload)
  const estimatedDbBytes = databaseRecords * 2048 + Math.round(storageBytes * 0.02);

  return {
    dakId,
    dakNumber: dak.dak_number as string,
    subject: dak.subject as string,
    originalPdfs,
    correspondence,
    atrUploads,
    complianceReports,
    notesRemarks,
    notifications: notificationCount,
    tasks: taskCount,
    timelineEvents: timelineCount,
    databaseRecords,
    storageBytes,
    estimatedDbBytes,
    attachmentBreakdown: breakdown,
  };
}

export interface LargestDakRow {
  id: string;
  dakNumber: string;
  subject: string;
  status: string;
  totalSize: number;
  fileCount: number;
  archived: boolean;
  deleted: boolean;
}

/** Top N DAKs by attachment storage size — Storage Explorer. */
export async function getLargestDaks(limit = 20): Promise<LargestDakRow[]> {
  const supabase = createAdminClient();

  const { data: attachments, error } = await supabase
    .from("attachments")
    .select("dak_id, file_size");

  if (error || !attachments?.length) {
    if (error) console.error("[getLargestDaks]", error.message);
    return [];
  }

  const totals = new Map<string, { size: number; files: number }>();
  for (const row of attachments) {
    const dakId = row.dak_id as string | null;
    if (!dakId) continue;
    const current = totals.get(dakId) ?? { size: 0, files: 0 };
    current.size += Number(row.file_size ?? 0);
    current.files += 1;
    totals.set(dakId, current);
  }

  const ranked = [...totals.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, limit);

  if (!ranked.length) return [];

  const ids = ranked.map(([id]) => id);
  const { data: daks } = await supabase
    .from("dak_entries")
    .select("id, dak_number, subject, status, archived_at, deleted_at")
    .in("id", ids);

  const byId = new Map((daks ?? []).map((d) => [d.id as string, d]));

  return ranked
    .map(([id, stats]) => {
      const dak = byId.get(id);
      if (!dak) return null;
      return {
        id,
        dakNumber: dak.dak_number as string,
        subject: dak.subject as string,
        status: dak.status as string,
        totalSize: stats.size,
        fileCount: stats.files,
        archived: Boolean(dak.archived_at),
        deleted: Boolean(dak.deleted_at),
      };
    })
    .filter((row): row is LargestDakRow => row !== null);
}
