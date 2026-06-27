"use server";

import { revalidatePath } from "next/cache";

import {
  canTransition,
  getStatusLabel,
  normalizeDakStatus,
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

function revalidateDakPaths(dakId: string) {
  revalidatePath(`/dashboard/dak/${dakId}`);
  revalidatePath("/dashboard/dak");
  revalidatePath("/dashboard/dak/assignments");
  revalidatePath("/dashboard/dak/pending");
  revalidatePath("/dashboard/dak/completed");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/audit");
}

/** Update DAK workflow status — District/Block Officers (DLO). */
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
      .select("id, status, department_id")
      .eq("id", parsed.data.dakId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, message: "DAK entry not found." };
    }

    const currentStatus = existing.status as string;
    const nextStatus = parsed.data.status;

    if (normalizeDakStatus(currentStatus) === nextStatus) {
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

    if (
      user.departmentId &&
      existing.department_id &&
      user.departmentId !== existing.department_id &&
      user.role !== "collector"
    ) {
      return {
        success: false,
        message: "You can only update DAK assigned to your department.",
      };
    }

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      updated_by: user.id,
    };

    if (nextStatus === "completed") {
      updatePayload.disposed_date = new Date().toISOString().slice(0, 10);
    }

    if (nextStatus === "closed") {
      updatePayload.closed_date = new Date().toISOString().slice(0, 10);
    }

    const { error: updateError } = await supabase
      .from("dak_entries")
      .update(updatePayload)
      .eq("id", parsed.data.dakId);

    if (updateError) {
      console.error("[updateDakStatus]", updateError);
      return {
        success: false,
        message: updateError.message ?? "Failed to update status.",
      };
    }

    const historyEventType =
      nextStatus === "completed"
        ? "completed"
        : nextStatus === "closed"
          ? "closed"
          : "status_changed";

    const historyAction =
      nextStatus === "completed"
        ? "Completed"
        : nextStatus === "closed"
          ? "Closed"
          : `Status Changed to ${getStatusLabel(nextStatus)}`;

    const historyRemarks =
      parsed.data.remarks?.trim() ||
      `Changed from ${getStatusLabel(currentStatus)} to ${getStatusLabel(nextStatus)}`;

    await logWorkflowAction({
      dakId: parsed.data.dakId,
      userId: user.id,
      eventType: historyEventType,
      action: historyAction,
      remarks: historyRemarks,
      fromStatus: currentStatus,
      toStatus: nextStatus,
    });

    revalidateDakPaths(parsed.data.dakId);

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

export { updateDakStatus as updateStatus };
