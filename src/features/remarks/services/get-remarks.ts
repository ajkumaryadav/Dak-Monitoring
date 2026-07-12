import type { DakRemarkType } from "@/features/remarks/lib/remark-types";
import { isMissingAtrDraftColumnError } from "@/features/remarks/lib/atr-draft-support";
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

export interface ComplianceDraftRecord {
  id: string;
  dakId: string;
  actionTaken: string;
  attachmentFileName: string | null;
  attachmentDownloadUrl: string | null;
  updatedAt: string;
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

const ATR_SELECT = `
  id,
  dak_id,
  action_taken,
  submitted_at,
  attachment_file_name,
  attachment_file_path,
  attachment_storage_bucket,
  submitter:users!dak_atr_submitted_by_fkey(name, roles(slug))
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

async function mapAtrRows(
  rows: Record<string, unknown>[]
): Promise<DakAtrRecord[]> {
  const supabase = createAdminClient();
  const records: DakAtrRecord[] = [];

  for (const row of rows) {
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

/** Fetch remarks for a DAK, filtered by viewer permissions. */
export async function getDakRemarks(
  dakId: string,
  user: SessionUser
): Promise<DakRemarkRecord[]> {
  if (user.role === "dak_operator") {
    return [];
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dak_remarks")
    .select(REMARK_SELECT)
    .eq("dak_id", dakId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[getDakRemarks]", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => mapRemarkRow(row as Record<string, unknown>))
    .filter((remark) => canViewRemarkType(user, remark.remarkType));
}

/** Fetch submitted ATR records for a DAK (excludes drafts when column exists). */
export async function getDakAtrRecords(
  dakId: string,
  user?: SessionUser | null
): Promise<DakAtrRecord[]> {
  if (user?.role === "dak_operator") {
    return [];
  }

  const supabase = createAdminClient();

  const primary = await supabase
    .from("dak_atr")
    .select(ATR_SELECT)
    .eq("dak_id", dakId)
    .eq("is_draft", false)
    .order("submitted_at", { ascending: false })
    .order("id", { ascending: false });

  let data = primary.data;
  let error = primary.error;

  if (error && isMissingAtrDraftColumnError(error.message)) {
    const fallback = await supabase
      .from("dak_atr")
      .select(ATR_SELECT)
      .eq("dak_id", dakId)
      .order("submitted_at", { ascending: false })
      .order("id", { ascending: false });

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("[getDakAtrRecords]", error.message);
    return [];
  }

  return mapAtrRows((data ?? []) as Record<string, unknown>[]);
}

/** Fetch the officer's saved compliance draft for a DAK. */
export async function getComplianceDraft(
  dakId: string,
  userId: string
): Promise<ComplianceDraftRecord | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dak_atr")
    .select(
      "id, dak_id, action_taken, submitted_at, attachment_file_name, attachment_file_path, attachment_storage_bucket"
    )
    .eq("dak_id", dakId)
    .eq("submitted_by", userId)
    .eq("is_draft", true)
    .maybeSingle();

  if (error) {
    if (isMissingAtrDraftColumnError(error.message)) {
      return null;
    }
    console.error("[getComplianceDraft]", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  let attachmentDownloadUrl: string | null = null;
  const filePath = data.attachment_file_path as string | null;
  const bucket =
    (data.attachment_storage_bucket as string | null) ?? "dak-attachments";

  if (filePath) {
    const { data: signed } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);
    attachmentDownloadUrl = signed?.signedUrl ?? null;
  }

  return {
    id: data.id as string,
    dakId: data.dak_id as string,
    actionTaken: data.action_taken as string,
    attachmentFileName: (data.attachment_file_name as string | null) ?? null,
    attachmentDownloadUrl,
    updatedAt: data.submitted_at as string,
  };
}
