"use server";

import { revalidatePath } from "next/cache";

import {
  sanitizeFileName,
  validateAttachmentFile,
} from "@/features/dak/lib/attachment-validation";
import { canEditCompliance } from "@/features/dak/lib/compliance-workflow";
import {
  saveComplianceDraftSchema,
  submitComplianceSchema,
} from "@/features/dak/schemas/compliance-schema";
import {
  saveAttachmentRecord,
  uploadDakFile,
} from "@/features/dak/actions/upload-attachment";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { notifyAtrSubmitted } from "@/features/remarks/services/notify-remark-event";
import { notifyComplianceResubmitted } from "@/features/dak-requests/services/notify-dak-request-event";
import { isMissingAtrDraftColumnError } from "@/features/remarks/lib/atr-draft-support";
import {
  canSubmitComplianceRole,
  hasPermission,
  PERMISSIONS,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import type { SessionUser } from "@/types";

const STORAGE_BUCKET = "dak-attachments";

export type ComplianceActionResult =
  | { success: true }
  | { success: false; message: string };

export type ComplianceFormState = {
  message?: string;
  success?: boolean;
};

type DakScopeRow = {
  id: string;
  status: string;
  dak_number: string;
  department_id: string | null;
  assignment_unit_id: string | null;
  assigned_to: string | null;
};

function revalidateDakPaths(dakId: string) {
  revalidatePath(`/dashboard/dak/${dakId}`);
  revalidatePath("/dashboard/dak");
  revalidatePath("/dashboard/dak/assigned");
  revalidatePath("/dashboard/dak/pending");
  revalidatePath("/dashboard/dak/pending-approval");
  revalidatePath("/dashboard/dak/completed");
  revalidatePath("/dashboard");
}

async function loadDakForOfficer(
  dakId: string,
  user: SessionUser
): Promise<{ dak: DakScopeRow } | { error: string }> {
  const supabase = createAdminClient();
  const { data: dak, error } = await supabase
    .from("dak_entries")
    .select(
      "id, status, dak_number, department_id, assignment_unit_id, assigned_to"
    )
    .eq("id", dakId)
    .maybeSingle();

  if (error || !dak) {
    return { error: "DAK entry not found." };
  }

  if (user.role === "department_user" && user.departmentId) {
    if (dak.department_id !== user.departmentId) {
      return { error: "This DAK is not assigned to your department." };
    }
  }

  if (user.role === "section_user" && user.sectionId) {
    if (dak.assignment_unit_id !== user.sectionId) {
      return { error: "This DAK is not assigned to your section." };
    }
  }

  return { dak: dak as DakScopeRow };
}

const DRAFT_MIGRATION_HINT =
  "Save Draft requires migration 000033. Run npm run db:apply-compliance-drafts or apply supabase/migrations/000033_compliance_drafts.sql in Supabase SQL Editor.";

async function upsertComplianceDraft(params: {
  dakId: string;
  userId: string;
  actionTaken: string;
  attachmentMeta?: {
    fileName: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
  } | null;
}): Promise<ComplianceActionResult> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: existingDraft, error: draftLookupError } = await supabase
    .from("dak_atr")
    .select("id, attachment_file_path, attachment_storage_bucket")
    .eq("dak_id", params.dakId)
    .eq("submitted_by", params.userId)
    .eq("is_draft", true)
    .maybeSingle();

  if (draftLookupError && isMissingAtrDraftColumnError(draftLookupError.message)) {
    return { success: false, message: DRAFT_MIGRATION_HINT };
  }

  if (draftLookupError) {
    return { success: false, message: draftLookupError.message ?? "Failed to save draft." };
  }

  const payload = {
    action_taken: params.actionTaken || "Draft — action summary pending",
    submitted_at: now,
    is_draft: true,
    attachment_file_name: params.attachmentMeta?.fileName ?? null,
    attachment_file_path: params.attachmentMeta?.filePath ?? null,
    attachment_storage_bucket: params.attachmentMeta ? STORAGE_BUCKET : null,
    attachment_mime_type: params.attachmentMeta?.mimeType ?? null,
    attachment_file_size: params.attachmentMeta?.fileSize ?? null,
  };

  if (existingDraft) {
    if (
      params.attachmentMeta &&
      existingDraft.attachment_file_path &&
      existingDraft.attachment_file_path !== params.attachmentMeta.filePath
    ) {
      await supabase.storage
        .from(
          (existingDraft.attachment_storage_bucket as string) ?? STORAGE_BUCKET
        )
        .remove([existingDraft.attachment_file_path as string]);
    }

    const { error } = await supabase
      .from("dak_atr")
      .update(payload)
      .eq("id", existingDraft.id);

    if (error) {
      if (isMissingAtrDraftColumnError(error.message)) {
        return { success: false, message: DRAFT_MIGRATION_HINT };
      }
      return { success: false, message: error.message ?? "Failed to save draft." };
    }

    return { success: true };
  }

  const { error } = await supabase.from("dak_atr").insert({
    dak_id: params.dakId,
    submitted_by: params.userId,
    created_at: now,
    ...payload,
  });

  if (error) {
    if (isMissingAtrDraftColumnError(error.message)) {
      return { success: false, message: DRAFT_MIGRATION_HINT };
    }
    return { success: false, message: error.message ?? "Failed to save draft." };
  }

  return { success: true };
}

/** Auto-advance assigned DAK to in progress when the officer opens it. */
export async function markDakOpened(dakId: string): Promise<ComplianceActionResult> {
  try {
    const user = await getSessionUser();
    if (!user || !canSubmitComplianceRole(user.role)) {
      return { success: false, message: "Unauthorized." };
    }

    const loaded = await loadDakForOfficer(dakId, user);
    if ("error" in loaded) {
      return { success: false, message: loaded.error };
    }

    const { dak } = loaded;
    if (dak.status !== "assigned") {
      return { success: true };
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("dak_entries")
      .update({ status: "in_progress", updated_by: user.id })
      .eq("id", dakId);

    if (error) {
      return { success: false, message: error.message ?? "Failed to update status." };
    }

    await logWorkflowAction({
      dakId,
      userId: user.id,
      eventType: "status_changed",
      timelineActionType: "status_changed",
      action: "Officer Opened DAK",
      remarks: "Processing started automatically when the assigned officer opened this DAK.",
      fromStatus: dak.status,
      toStatus: "in_progress",
    });

    revalidateDakPaths(dakId);
    return { success: true };
  } catch (error) {
    console.error("[markDakOpened]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

async function ensureInProgress(
  dakId: string,
  user: SessionUser,
  currentStatus: string
): Promise<void> {
  if (currentStatus !== "assigned") {
    return;
  }

  await markDakOpened(dakId);
}

/** Save compliance progress without submitting to Collector. */
export async function saveComplianceDraft(
  input: { dakId: string; actionTaken: string },
  atrFile?: File | null,
  supportingFile?: File | null
): Promise<ComplianceActionResult> {
  try {
    const user = await getSessionUser();
    if (
      !user ||
      !hasPermission(user.role, PERMISSIONS.DAK_UPDATE) ||
      !canSubmitComplianceRole(user.role)
    ) {
      return { success: false, message: "You do not have permission to save progress." };
    }

    const parsed = saveComplianceDraftSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid form data",
      };
    }

    const loaded = await loadDakForOfficer(parsed.data.dakId, user);
    if ("error" in loaded) {
      return { success: false, message: loaded.error };
    }

    const { dak } = loaded;
    if (!canEditCompliance(dak.status)) {
      return {
        success: false,
        message: "This DAK can no longer be edited. It may already be submitted.",
      };
    }

    await ensureInProgress(parsed.data.dakId, user, dak.status);

    let attachmentMeta: {
      fileName: string;
      filePath: string;
      mimeType: string;
      fileSize: number;
    } | null = null;

    if (atrFile && atrFile.size > 0) {
      const validation = validateAttachmentFile(atrFile);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const upload = await uploadDakFile(parsed.data.dakId, atrFile);
      if (!upload.success) {
        return { success: false, message: upload.message };
      }

      attachmentMeta = {
        fileName: sanitizeFileName(atrFile.name),
        filePath: upload.filePath,
        mimeType: atrFile.type || "application/octet-stream",
        fileSize: atrFile.size,
      };
    }

    const draftResult = await upsertComplianceDraft({
      dakId: parsed.data.dakId,
      userId: user.id,
      actionTaken: parsed.data.actionTaken,
      attachmentMeta,
    });

    if (!draftResult.success) {
      if (attachmentMeta) {
        const supabase = createAdminClient();
        await supabase.storage.from(STORAGE_BUCKET).remove([attachmentMeta.filePath]);
      }
      return draftResult;
    }

    if (supportingFile && supportingFile.size > 0) {
      const validation = validateAttachmentFile(supportingFile);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const upload = await uploadDakFile(parsed.data.dakId, supportingFile);
      if (!upload.success) {
        return { success: false, message: upload.message };
      }

      await saveAttachmentRecord({
        dakId: parsed.data.dakId,
        file: supportingFile,
        filePath: upload.filePath,
        uploadedBy: user.id,
      });
    }

    if (parsed.data.actionTaken.trim().length >= 3) {
      await logWorkflowAction({
        dakId: parsed.data.dakId,
        userId: user.id,
        eventType: "remarks_added",
        timelineActionType: "remark_added",
        action: "Action Taken Summary Saved (Draft)",
        remarks: parsed.data.actionTaken.slice(0, 500),
      });
    }

    revalidateDakPaths(parsed.data.dakId);
    return { success: true };
  } catch (error) {
    console.error("[saveComplianceDraft]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

/** Submit compliance to Collector — remark and ATR are mandatory. */
export async function submitCompliance(
  input: { dakId: string; actionTaken: string },
  atrFile?: File | null,
  supportingFile?: File | null
): Promise<ComplianceActionResult> {
  try {
    const user = await getSessionUser();
    if (
      !user ||
      !hasPermission(user.role, PERMISSIONS.DAK_UPDATE) ||
      !canSubmitComplianceRole(user.role)
    ) {
      return { success: false, message: "You do not have permission to submit compliance." };
    }

    const parsed = submitComplianceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid form data",
      };
    }

    const loaded = await loadDakForOfficer(parsed.data.dakId, user);
    if ("error" in loaded) {
      return { success: false, message: loaded.error };
    }

    const { dak } = loaded;
    if (!canEditCompliance(dak.status)) {
      return {
        success: false,
        message: "This DAK has already been submitted or is awaiting Collector review.",
      };
    }

    await ensureInProgress(parsed.data.dakId, user, dak.status);

    const supabase = createAdminClient();

    let priorSubmissionCountQuery = await supabase
      .from("dak_atr")
      .select("id", { count: "exact", head: true })
      .eq("dak_id", parsed.data.dakId)
      .eq("is_draft", false);

    if (
      priorSubmissionCountQuery.error &&
      isMissingAtrDraftColumnError(priorSubmissionCountQuery.error.message)
    ) {
      priorSubmissionCountQuery = await supabase
        .from("dak_atr")
        .select("id", { count: "exact", head: true })
        .eq("dak_id", parsed.data.dakId);
    }

    const isResubmission = (priorSubmissionCountQuery.count ?? 0) > 0;

    const { data: existingDraft, error: draftLookupError } = await supabase
      .from("dak_atr")
      .select("id, attachment_file_path, attachment_file_name, attachment_mime_type, attachment_file_size, attachment_storage_bucket")
      .eq("dak_id", parsed.data.dakId)
      .eq("submitted_by", user.id)
      .eq("is_draft", true)
      .maybeSingle();

    const draftLookupMissingColumn =
      draftLookupError &&
      isMissingAtrDraftColumnError(draftLookupError.message);

    const resolvedDraft = draftLookupMissingColumn ? null : existingDraft;

    let attachmentMeta: {
      fileName: string;
      filePath: string;
      mimeType: string;
      fileSize: number;
    } | null = null;

    if (atrFile && atrFile.size > 0) {
      const validation = validateAttachmentFile(atrFile);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const upload = await uploadDakFile(parsed.data.dakId, atrFile);
      if (!upload.success) {
        return { success: false, message: upload.message };
      }

      attachmentMeta = {
        fileName: sanitizeFileName(atrFile.name),
        filePath: upload.filePath,
        mimeType: atrFile.type || "application/octet-stream",
        fileSize: atrFile.size,
      };
    } else if (resolvedDraft?.attachment_file_path) {
      attachmentMeta = {
        fileName: (resolvedDraft.attachment_file_name as string) ?? "atr-document",
        filePath: resolvedDraft.attachment_file_path as string,
        mimeType: (resolvedDraft.attachment_mime_type as string) ?? "application/octet-stream",
        fileSize: (resolvedDraft.attachment_file_size as number) ?? 0,
      };
    }

    if (!attachmentMeta) {
      return {
        success: false,
        message: "Please upload the Action Taken Report (ATR).",
      };
    }

    const submittedAt = new Date().toISOString();

    if (resolvedDraft) {
      await supabase.from("dak_atr").delete().eq("id", resolvedDraft.id);
    }

    const insertPayload = {
      dak_id: parsed.data.dakId,
      action_taken: parsed.data.actionTaken,
      submitted_by: user.id,
      submitted_at: submittedAt,
      created_at: submittedAt,
      is_draft: false,
      attachment_file_name: attachmentMeta.fileName,
      attachment_file_path: attachmentMeta.filePath,
      attachment_storage_bucket: STORAGE_BUCKET,
      attachment_mime_type: attachmentMeta.mimeType,
      attachment_file_size: attachmentMeta.fileSize,
    };

    let { error: insertError } = await supabase.from("dak_atr").insert(insertPayload);

    if (
      insertError &&
      isMissingAtrDraftColumnError(insertError.message)
    ) {
      const { is_draft: _draft, ...legacyPayload } = insertPayload;
      const retry = await supabase.from("dak_atr").insert(legacyPayload);
      insertError = retry.error;
    }

    if (insertError) {
      if (atrFile && atrFile.size > 0 && attachmentMeta) {
        await supabase.storage.from(STORAGE_BUCKET).remove([attachmentMeta.filePath]);
      }
      return {
        success: false,
        message: insertError.message ?? "Failed to submit compliance.",
      };
    }

    if (supportingFile && supportingFile.size > 0) {
      const validation = validateAttachmentFile(supportingFile);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const upload = await uploadDakFile(parsed.data.dakId, supportingFile);
      if (upload.success) {
        await saveAttachmentRecord({
          dakId: parsed.data.dakId,
          file: supportingFile,
          filePath: upload.filePath,
          uploadedBy: user.id,
        });
      }
    }

    const { error: statusError } = await supabase
      .from("dak_entries")
      .update({
        status: "pending_approval",
        updated_by: user.id,
      })
      .eq("id", parsed.data.dakId);

    if (statusError) {
      return { success: false, message: statusError.message ?? "Failed to update status." };
    }

    await logWorkflowAction({
      dakId: parsed.data.dakId,
      userId: user.id,
      eventType: "atr_submitted",
      timelineActionType: "atr_submitted",
      action: isResubmission
        ? "Revised Compliance Submitted to Collector"
        : "Submitted Compliance to Collector",
      remarks: parsed.data.actionTaken.slice(0, 500),
      fromStatus: dak.status,
      toStatus: "pending_approval",
      metadata: { has_attachment: true, resubmitted: isResubmission },
    });

    if (isResubmission) {
      await notifyComplianceResubmitted({
        dakId: parsed.data.dakId,
        dakNumber: dak.dak_number,
        actorUserId: user.id,
        actorName: user.name,
      });
    } else {
      await notifyAtrSubmitted({
        dakId: parsed.data.dakId,
        dakNumber: dak.dak_number,
        actorUserId: user.id,
        actorName: user.name,
      });
    }

    revalidateDakPaths(parsed.data.dakId);
    return { success: true };
  } catch (error) {
    console.error("[submitCompliance]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

function parseComplianceForm(formData: FormData) {
  return {
    dakId: formData.get("dakId") as string,
    actionTaken: (formData.get("actionTaken") as string) ?? "",
    atrFile: formData.get("atrFile"),
    supportingFile: formData.get("supportingFile"),
  };
}

function toFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

export async function saveComplianceDraftFormAction(
  _prev: ComplianceFormState,
  formData: FormData
): Promise<ComplianceFormState> {
  const { dakId, actionTaken, atrFile, supportingFile } = parseComplianceForm(formData);
  const result = await saveComplianceDraft(
    { dakId, actionTaken },
    toFile(atrFile),
    toFile(supportingFile)
  );

  if (!result.success) {
    return { message: result.message };
  }

  return { success: true, message: "Progress saved. You can continue later." };
}

export async function submitComplianceFormAction(
  _prev: ComplianceFormState,
  formData: FormData
): Promise<ComplianceFormState> {
  const { dakId, actionTaken, atrFile, supportingFile } = parseComplianceForm(formData);
  const result = await submitCompliance(
    { dakId, actionTaken },
    toFile(atrFile),
    toFile(supportingFile)
  );

  if (!result.success) {
    return { message: result.message };
  }

  return { success: true, message: "Compliance submitted to Collector for review." };
}

export async function markDakOpenedAction(dakId: string): Promise<void> {
  await markDakOpened(dakId);
}
