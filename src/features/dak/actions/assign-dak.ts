"use server";

import { revalidatePath } from "next/cache";

import {
  assignDakSchema,
  type AssignDakInput,
} from "@/features/dak/schemas/assign-schema";
import { canAssignStatus, getStatusLabel } from "@/features/dak/lib/workflow";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { hasPermission, PERMISSIONS } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type AssignDakResult =
  | { success: true }
  | { success: false; message: string };

export type AssignDakFormState = {
  message?: string;
  errors?: Partial<Record<keyof AssignDakInput, string[]>>;
};

function revalidateDakPaths(dakId: string) {
  revalidatePath(`/dashboard/dak/${dakId}`);
  revalidatePath("/dashboard/dak");
  revalidatePath("/dashboard/dak/assignments");
  revalidatePath("/dashboard/dak/pending");
  revalidatePath("/dashboard/dak/completed");
  revalidatePath("/dashboard");
}

/** Assign a DAK to a department — Collector and ADM only. */
export async function assignDak(
  input: AssignDakInput
): Promise<AssignDakResult> {
  try {
    const user = await getSessionUser();

    if (!user) {
      return {
        success: false,
        message: "Your session has expired. Please sign in again.",
      };
    }

    if (!hasPermission(user.role, PERMISSIONS.DAK_ASSIGN)) {
      return {
        success: false,
        message: "You do not have permission to assign DAK entries.",
      };
    }

    const parsed = assignDakSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid form data",
      };
    }

    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("dak_entries")
      .select("id, status, dak_number")
      .eq("id", parsed.data.dakId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, message: "DAK entry not found." };
    }

    if (!canAssignStatus(existing.status as string)) {
      return {
        success: false,
        message: "Only received DAK entries can be assigned.",
      };
    }

    const { data: department, error: deptError } = await supabase
      .from("departments")
      .select("name")
      .eq("id", parsed.data.departmentId)
      .maybeSingle();

    if (deptError || !department) {
      return { success: false, message: "Selected department not found." };
    }

    const assignedTo = parsed.data.assignedTo?.trim() || null;

    const { error: updateError } = await supabase
      .from("dak_entries")
      .update({
        department_id: parsed.data.departmentId,
        assigned_to: assignedTo,
        assigned_by: user.id,
        status: "assigned",
      })
      .eq("id", parsed.data.dakId);

    if (updateError) {
      console.error("[assignDak]", updateError);
      return {
        success: false,
        message: updateError.message ?? "Failed to assign DAK.",
      };
    }

    await logWorkflowAction({
      dakId: parsed.data.dakId,
      userId: user.id,
      action: `Assigned to ${department.name}`,
      remarks:
        parsed.data.remarks?.trim() ||
        `Department allocation for ${existing.dak_number}`,
      fromStatus: existing.status as string,
      toStatus: "assigned",
    });

    revalidateDakPaths(parsed.data.dakId);

    return { success: true };
  } catch (error) {
    console.error("[assignDak]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while assigning.",
    };
  }
}

/** Form action for DAK assignment on the detail page. */
export async function assignDakFormAction(
  _prevState: AssignDakFormState,
  formData: FormData
): Promise<AssignDakFormState> {
  const parsed = assignDakSchema.safeParse({
    dakId: formData.get("dakId"),
    departmentId: formData.get("departmentId"),
    assignedTo: formData.get("assignedTo") ?? "",
    remarks: formData.get("remarks") ?? "",
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Invalid form data",
      errors: parsed.error.flatten().fieldErrors as AssignDakFormState["errors"],
    };
  }

  const result = await assignDak(parsed.data);

  if (!result.success) {
    return { message: result.message };
  }

  return {};
}
