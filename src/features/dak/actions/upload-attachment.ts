"use server";

import { randomUUID } from "crypto";

import {
  getFileExtension,
  sanitizeFileName,
  validateAttachmentFile,
} from "@/features/dak/lib/attachment-validation";
import { createAdminClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "dak-attachments";
const SIGNED_URL_TTL_SECONDS = 3600;

export interface DakAttachmentRecord {
  id: string;
  dak_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploaded_by?: string | null;
}

export interface DakAttachmentWithUrl extends DakAttachmentRecord {
  downloadUrl: string;
}

export type UploadAttachmentResult =
  | { success: true; attachmentId: string; filePath: string }
  | { success: false; message: string };

/** Upload a file to Supabase Storage under the DAK folder. */
export async function uploadDakFile(
  dakId: string,
  file: File
): Promise<UploadAttachmentResult> {
  const validation = validateAttachmentFile(file);

  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const supabase = createAdminClient();
  const safeName = sanitizeFileName(file.name);
  const extension = getFileExtension(safeName);
  const filePath = `${dakId}/${randomUUID()}${extension}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("[uploadDakFile]", error);
    return {
      success: false,
      message: error.message ?? "Failed to upload attachment.",
    };
  }

  return { success: true, attachmentId: filePath, filePath };
}

/** Persist attachment metadata linked to a DAK entry. */
export async function saveAttachmentRecord(params: {
  dakId: string;
  file: File;
  filePath: string;
  uploadedBy: string;
}): Promise<UploadAttachmentResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      dak_id: params.dakId,
      file_name: sanitizeFileName(params.file.name),
      file_path: params.filePath,
      storage_bucket: STORAGE_BUCKET,
      file_size: params.file.size,
      mime_type: params.file.type || "application/octet-stream",
      uploaded_by: params.uploadedBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[saveAttachmentRecord]", error);
    await supabase.storage.from(STORAGE_BUCKET).remove([params.filePath]);
    return {
      success: false,
      message: error?.message ?? "Failed to save attachment record.",
    };
  }

  return {
    success: true,
    attachmentId: data.id as string,
    filePath: params.filePath,
  };
}

/** Upload file and save metadata — used after DAK creation. */
export async function uploadDakAttachment(
  dakId: string,
  file: File,
  uploadedBy: string
): Promise<UploadAttachmentResult> {
  const uploadResult = await uploadDakFile(dakId, file);

  if (!uploadResult.success) {
    return uploadResult;
  }

  return saveAttachmentRecord({
    dakId,
    file,
    filePath: uploadResult.filePath,
    uploadedBy,
  });
}

/** Create a time-limited signed download URL for a stored attachment. */
export async function createAttachmentSignedUrl(
  filePath: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("[createAttachmentSignedUrl]", error);
    return null;
  }

  return data.signedUrl;
}

/** Fetch attachments for a DAK with signed download URLs. */
export async function getDakAttachments(
  dakId: string,
  options?: {
    registrarId?: string | null;
    before?: string | null;
  }
): Promise<DakAttachmentWithUrl[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("attachments")
    .select(
      "id, dak_id, file_name, file_path, file_size, mime_type, created_at, uploaded_by"
    )
    .eq("dak_id", dakId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[getDakAttachments]", error.message);
    return [];
  }

  let attachments = (data ?? []) as DakAttachmentRecord[];

  if (options?.registrarId || options?.before) {
    attachments = attachments.filter((attachment) => {
      if (options.registrarId && attachment.uploaded_by) {
        return attachment.uploaded_by === options.registrarId;
      }

      if (options.before) {
        return attachment.created_at <= options.before;
      }

      return true;
    });
  }
  const withUrls: DakAttachmentWithUrl[] = [];

  for (const attachment of attachments) {
    const downloadUrl = await createAttachmentSignedUrl(attachment.file_path);

    if (downloadUrl) {
      withUrls.push({ ...attachment, downloadUrl });
    }
  }

  return withUrls;
}
