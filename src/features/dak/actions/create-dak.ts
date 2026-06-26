"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createDakSchema,
  type CreateDakInput,
} from "@/features/dak/schemas/dak-schema";
import { syncUserProfile } from "@/features/auth/actions/sync-user";
import { uploadDakAttachment } from "@/features/dak/actions/upload-attachment";
import { validateAttachmentFile } from "@/features/dak/lib/attachment-validation";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { hasPermission, PERMISSIONS } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type CreateDakResult =
  | { success: true; dakId: string }
  | { success: false; message: string };

export type CreateDakFormState = {
  message?: string;
  errors?: Partial<Record<keyof CreateDakInput, string[]>>;
};

function getAttachmentFromFormData(
  formData: FormData
): File | undefined {
  const entry = formData.get("attachment");

  if (!(entry instanceof File) || entry.size === 0) {
    return undefined;
  }

  return entry;
}

/** Register a new DAK entry in Supabase. */
export async function createDak(
  input: CreateDakInput,
  attachment?: File
): Promise<CreateDakResult> {
  try {
    const user = await getSessionUser();

    if (!user) {
      return {
        success: false,
        message: "Your session has expired. Please sign in again.",
      };
    }

    if (!hasPermission(user.role, PERMISSIONS.DAK_ENTRY)) {
      return {
        success: false,
        message: "You do not have permission to register DAK entries.",
      };
    }

    if (attachment) {
      const fileValidation = validateAttachmentFile(attachment);

      if (!fileValidation.valid) {
        return { success: false, message: fileValidation.message };
      }
    }

    await syncUserProfile();

    const parsed = createDakSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid form data",
      };
    }

    const supabase = createAdminClient();
    const receivedDate = getDistrictDateString();

    const { data: inserted, error } = await supabase
      .from("dak_entries")
      .insert({
        dak_number: `DAK-${Date.now()}`,
        subject: parsed.data.subject,
        sender: parsed.data.senderName,
        sender_address: parsed.data.senderAddress,
        priority: parsed.data.priority,
        department_id: parsed.data.departmentId,
        due_date: parsed.data.dueDate.slice(0, 10),
        description: parsed.data.remarks?.trim() || null,
        status: "received",
        received_date: receivedDate,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[createDak]", error);
      return {
        success: false,
        message: error?.message ?? "Failed to save DAK entry.",
      };
    }

    await logWorkflowAction({
      dakId: inserted.id,
      userId: user.id,
      action: "DAK Registered",
      remarks: parsed.data.remarks?.trim() || "New correspondence registered",
    });

    if (attachment) {
      const uploadResult = await uploadDakAttachment(
        inserted.id,
        attachment,
        user.id
      );

      if (!uploadResult.success) {
        return {
          success: false,
          message: `DAK saved but attachment upload failed: ${uploadResult.message}`,
        };
      }

      await logWorkflowAction({
        dakId: inserted.id,
        userId: user.id,
        action: "Attachment uploaded",
        remarks: attachment.name,
      });
    }

    return { success: true, dakId: inserted.id };
  } catch (error) {
    console.error("[createDak]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving.",
    };
  }
}

/** Form action for DAK registration — same pattern as login. */
export async function createDakFormAction(
  _prevState: CreateDakFormState,
  formData: FormData
): Promise<CreateDakFormState> {
  const attachment = getAttachmentFromFormData(formData);

  if (attachment) {
    const fileValidation = validateAttachmentFile(attachment);

    if (!fileValidation.valid) {
      return {
        message: fileValidation.message,
        errors: { attachment: [fileValidation.message] },
      };
    }
  }

  const parsed = createDakSchema.safeParse({
    subject: formData.get("subject"),
    senderName: formData.get("senderName"),
    senderAddress: formData.get("senderAddress"),
    priority: formData.get("priority"),
    departmentId: formData.get("departmentId"),
    dueDate: formData.get("dueDate"),
    remarks: formData.get("remarks") ?? "",
    attachment,
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Invalid form data",
      errors: parsed.error.flatten().fieldErrors as CreateDakFormState["errors"],
    };
  }

  const result = await createDak(parsed.data, attachment);

  if (!result.success) {
    return { message: result.message };
  }

  revalidatePath("/dashboard/dak");
  revalidatePath("/dashboard/dak/pending");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/dak/${result.dakId}`);
  redirect(`/dashboard/dak/${result.dakId}`);
}
