"use server";

import { revalidatePath } from "next/cache";

import {
  getStatusLabel,
  canTransition,
} from "@/features/dak/lib/workflow";
import {
  updateDakStatusSchema,
  type UpdateDakStatusInput,
} from "@/features/dak/schemas/status-schema";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { hasPermission, PERMISSIONS } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import type { DakStatus } from "@/types";

export type UpdateDakStatusResult =
  | { success: true }
  | { success: false; message: string };

export type UpdateDakStatusFormState = {
  message?: string;
  errors?: Partial<Record<keyof UpdateDakStatusInput, string[]>>;
};

/** Update DAK workflow status and record a timeline log. */
export async function updateDakStatus(
  input: UpdateDakStatusInput
): Promise<UpdateDakStatusResult> {
  try {
    const user = await getSessionUser();

    if (!user) {
      return {
        success: false,
        message: "Your session has expired. Please sign in again.",
      };
    }

    if (!hasPermission(user.role, PERMISSIONS.DAK_UPDATE)) {
      return {
        success: false,
        message: "You do not have permission to update DAK status.",
      };
    }

    const parsed = updateDakStatusSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid form data",
      };
    }

    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("dak_entries")
      .select("id, status")
      .eq("id", parsed.data.dakId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, message: "DAK entry not found." };
    }

    const currentStatus = existing.status as DakStatus;
    const nextStatus = parsed.data.status;

    if (currentStatus === nextStatus) {
      return {
        success: false,
        message: "The selected status matches the current status.",
      };
    }

    if (!canTransition(currentStatus, nextStatus)) {
      return {
        success: false,
        message: `Cannot change status from ${getStatusLabel(currentStatus)} to ${getStatusLabel(nextStatus)}.`,
      };
    }

    const { error: updateError } = await supabase
      .from("dak_entries")
      .update({ status: nextStatus })
      .eq("id", parsed.data.dakId);

    if (updateError) {
      console.error("[updateDakStatus]", updateError);
      return {
        success: false,
        message: updateError.message ?? "Failed to update status.",
      };
    }

    const logResult = await logWorkflowAction({
      dakId: parsed.data.dakId,
      userId: user.id,
      action: `Status updated to ${getStatusLabel(nextStatus)}`,
      remarks:
        parsed.data.remarks?.trim() ||
        `Changed from ${getStatusLabel(currentStatus)} to ${getStatusLabel(nextStatus)}`,
    });

    if (!logResult.success) {
      console.error("[updateDakStatus] workflow log failed:", logResult.message);
    }

    revalidatePath(`/dashboard/dak/${parsed.data.dakId}`);
    revalidatePath("/dashboard/dak");
    revalidatePath("/dashboard/dak/pending");
    revalidatePath("/dashboard/dak/completed");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[updateDakStatus]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating status.",
    };
  }
}

/** Form action for status updates on the DAK detail page. */
export async function updateDakStatusFormAction(
  _prevState: UpdateDakStatusFormState,
  formData: FormData
): Promise<UpdateDakStatusFormState> {
  const parsed = updateDakStatusSchema.safeParse({
    dakId: formData.get("dakId"),
    status: formData.get("status"),
    remarks: formData.get("remarks") ?? "",
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Invalid form data",
      errors: parsed.error.flatten().fieldErrors as UpdateDakStatusFormState["errors"],
    };
  }

  const result = await updateDakStatus(parsed.data);

  if (!result.success) {
    return { message: result.message };
  }

  return {};
}
