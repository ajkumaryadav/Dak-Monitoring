"use server";

import { revalidatePath } from "next/cache";

import {
  validateAttachmentFile,
} from "@/features/dak/lib/attachment-validation";
import { uploadDakFile } from "@/features/dak/actions/upload-attachment";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { getRemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import {
  submitAtrSchema,
  type SubmitAtrInput,
} from "@/features/remarks/schemas/remark-schema";
import { notifyAtrSubmitted } from "@/features/remarks/services/notify-remark-event";
import { PERMISSIONS, hasPermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

const STORAGE_BUCKET = "dak-attachments";

export type SubmitAtrResult =
  | { success: true }
  | { success: false; message: string };

export type SubmitAtrFormState = {
  message?: string;
  success?: boolean;
};

export async function submitDakAtr(
  input: SubmitAtrInput,
  attachment?: File | null
): Promise<SubmitAtrResult> {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.DAK_VIEW)) {
      return { success: false, message: "You do not have permission to submit ATR." };
    }

    const perms = getRemarkPermissions(user);
    if (!perms.canSubmitAtr) {
      return { success: false, message: "Your role cannot submit Action Taken Reports." };
    }

    const parsed = submitAtrSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid ATR",
      };
    }

    let attachmentMeta: {
      fileName: string;
      filePath: string;
      mimeType: string;
      fileSize: number;
    } | null = null;

    if (attachment && attachment.size > 0) {
      const validation = validateAttachmentFile(attachment);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const upload = await uploadDakFile(
        parsed.data.dakId,
        attachment
      );

      if (!upload.success) {
        return { success: false, message: upload.message };
      }

      attachmentMeta = {
        fileName: attachment.name,
        filePath: upload.filePath,
        mimeType: attachment.type || "application/octet-stream",
        fileSize: attachment.size,
      };
    }

    const supabase = createAdminClient();

    const { data: dak, error: dakError } = await supabase
      .from("dak_entries")
      .select("id, dak_number")
      .eq("id", parsed.data.dakId)
      .maybeSingle();

    if (dakError || !dak) {
      return { success: false, message: "DAK entry not found." };
    }

    const submittedAt = new Date().toISOString();

    const { error } = await supabase.from("dak_atr").insert({
      dak_id: parsed.data.dakId,
      action_taken: parsed.data.actionTaken,
      submitted_by: user.id,
      submitted_at: submittedAt,
      created_at: submittedAt,
      attachment_file_name: attachmentMeta?.fileName ?? null,
      attachment_file_path: attachmentMeta?.filePath ?? null,
      attachment_storage_bucket: attachmentMeta ? STORAGE_BUCKET : null,
      attachment_mime_type: attachmentMeta?.mimeType ?? null,
      attachment_file_size: attachmentMeta?.fileSize ?? null,
    });

    if (error) {
      if (attachmentMeta) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([attachmentMeta.filePath]);
      }
      return { success: false, message: error.message ?? "Failed to submit ATR." };
    }

    await logWorkflowAction({
      dakId: parsed.data.dakId,
      userId: user.id,
      eventType: "atr_submitted",
      timelineActionType: "atr_submitted",
      action: "Action Taken Report submitted",
      remarks: parsed.data.actionTaken.slice(0, 500),
      metadata: { has_attachment: !!attachmentMeta },
    });

    await notifyAtrSubmitted({
      dakId: parsed.data.dakId,
      dakNumber: dak.dak_number as string,
      actorUserId: user.id,
      actorName: user.name,
    });

    revalidatePath(`/dashboard/dak/${parsed.data.dakId}`);
    return { success: true };
  } catch (error) {
    console.error("[submitDakAtr]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

export async function submitAtrFormAction(
  _prev: SubmitAtrFormState,
  formData: FormData
): Promise<SubmitAtrFormState> {
  const attachment = formData.get("attachment");
  const file =
    attachment instanceof File && attachment.size > 0 ? attachment : null;

  const result = await submitDakAtr(
    {
      dakId: formData.get("dakId") as string,
      actionTaken: formData.get("actionTaken") as string,
    },
    file
  );

  if (!result.success) {
    return { message: result.message };
  }

  return { success: true };
}
