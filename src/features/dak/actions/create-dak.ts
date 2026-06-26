"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createDakSchema,
  type CreateDakInput,
} from "@/features/dak/schemas/dak-schema";
import { syncUserProfile } from "@/features/auth/actions/sync-user";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { hasPermission, PERMISSIONS } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type CreateDakResult =
  | { success: true }
  | { success: false; message: string };

export type CreateDakFormState = {
  message?: string;
  errors?: Partial<Record<keyof CreateDakInput, string[]>>;
};

/** Register a new DAK entry in Supabase. */
export async function createDak(
  input: CreateDakInput
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

    await syncUserProfile();

    const parsed = createDakSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid form data",
      };
    }

    const supabase = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: inserted, error } = await supabase
      .from("dak_entries")
      .insert({
        dak_number: `DAK-${Date.now()}`,
        subject: parsed.data.subject,
        sender: parsed.data.senderName,
        sender_address: parsed.data.senderAddress,
        priority: parsed.data.priority,
        department_id: parsed.data.departmentId,
        due_date: parsed.data.dueDate,
        description: parsed.data.remarks?.trim() || null,
        status: "received",
        received_date: today,
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

    return { success: true };
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
  const parsed = createDakSchema.safeParse({
    subject: formData.get("subject"),
    senderName: formData.get("senderName"),
    senderAddress: formData.get("senderAddress"),
    priority: formData.get("priority"),
    departmentId: formData.get("departmentId"),
    dueDate: formData.get("dueDate"),
    remarks: formData.get("remarks") ?? "",
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Invalid form data",
      errors: parsed.error.flatten().fieldErrors as CreateDakFormState["errors"],
    };
  }

  const result = await createDak(parsed.data);

  if (!result.success) {
    return { message: result.message };
  }

  revalidatePath("/dashboard/dak");
  revalidatePath("/dashboard/dak/pending");
  revalidatePath("/dashboard");
  redirect("/dashboard/dak");
}
