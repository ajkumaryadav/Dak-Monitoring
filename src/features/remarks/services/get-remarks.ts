import type { DakRemarkType } from "@/features/remarks/lib/remark-types";
import { canViewRemarkType } from "@/features/remarks/lib/remark-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/types";

export interface DakRemarkRecord {
  id: string;
  dakId: string;
  remarkType: DakRemarkType;
  body: string;
  createdAt: string;
  authorName: string | null;
  authorRole: string | null;
}

export interface DakAtrRecord {
  id: string;
  dakId: string;
  actionTaken: string;
  submittedAt: string;
  submitterName: string | null;
  submitterRole: string | null;
  attachmentFileName: string | null;
  attachmentDownloadUrl: string | null;
}

const REMARK_SELECT = `
  id,
  dak_id,
  remark_type,
  body,
  created_at,
  author:users!dak_remarks_created_by_fkey(name, roles(slug))
`;

function mapRemarkRow(row: Record<string, unknown>): DakRemarkRecord {
  const author = row.author;
  const authorData = Array.isArray(author) ? author[0] : author;
  const roleRecord = (
    authorData as { roles?: { slug?: string } | { slug?: string }[] } | null
  )?.roles;
  const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;

  return {
    id: row.id as string,
    dakId: row.dak_id as string,
    remarkType: row.remark_type as DakRemarkType,
    body: row.body as string,
    createdAt: row.created_at as string,
    authorName: (authorData as { name?: string } | null)?.name ?? null,
    authorRole: roleData?.slug ?? null,
  };
}

/** Fetch remarks for a DAK, filtered by viewer permissions. */
export async function getDakRemarks(
  dakId: string,
  user: SessionUser
): Promise<DakRemarkRecord[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dak_remarks")
    .select(REMARK_SELECT)
    .eq("dak_id", dakId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getDakRemarks]", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => mapRemarkRow(row as Record<string, unknown>))
    .filter((remark) => canViewRemarkType(user, remark.remarkType));
}

/** Fetch ATR submissions for a DAK with signed attachment URLs. */
export async function getDakAtrRecords(
  dakId: string
): Promise<DakAtrRecord[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dak_atr")
    .select(
      `
      id,
      dak_id,
      action_taken,
      submitted_at,
      attachment_file_name,
      attachment_file_path,
      attachment_storage_bucket,
      submitter:users!dak_atr_submitted_by_fkey(name, roles(slug))
    `
    )
    .eq("dak_id", dakId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[getDakAtrRecords]", error.message);
    return [];
  }

  const records: DakAtrRecord[] = [];

  for (const row of data ?? []) {
    const submitter = row.submitter;
    const submitterData = Array.isArray(submitter) ? submitter[0] : submitter;
    const roleRecord = (
      submitterData as { roles?: { slug?: string } | { slug?: string }[] } | null
    )?.roles;
    const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;

    let attachmentDownloadUrl: string | null = null;
    const filePath = row.attachment_file_path as string | null;
    const bucket =
      (row.attachment_storage_bucket as string | null) ?? "dak-attachments";

    if (filePath) {
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);
      attachmentDownloadUrl = signed?.signedUrl ?? null;
    }

    records.push({
      id: row.id as string,
      dakId: row.dak_id as string,
      actionTaken: row.action_taken as string,
      submittedAt: row.submitted_at as string,
      submitterName: (submitterData as { name?: string } | null)?.name ?? null,
      submitterRole: roleData?.slug ?? null,
      attachmentFileName: (row.attachment_file_name as string | null) ?? null,
      attachmentDownloadUrl,
    });
  }

  return records;
}
