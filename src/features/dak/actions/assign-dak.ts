"use server";

import { revalidatePath } from "next/cache";

import {
  assignDakSchema,
  type AssignDakInput,
} from "@/features/dak/schemas/assign-schema";
import { canAssignStatus, canReassignStatus } from "@/features/dak/lib/workflow";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { getOfficerIdForDepartment } from "@/features/dak/services/get-department-officers";
import { hasPermission, PERMISSIONS } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type AssignDakResult =
  | { success: true }
  | { success: false; message: string };

export type AssignDakFormState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function revalidateDakPaths(dakId: string) {
  revalidatePath(`/dashboard/dak/${dakId}`);
  revalidatePath("/dashboard/dak");
  revalidatePath("/dashboard/dak/assignments");
  revalidatePath("/dashboard/dak/pending");
  revalidatePath("/dashboard/dak/completed");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/reports/pending");
  revalidatePath("/dashboard/audit");
}

function parseAssignFormData(formData: FormData): unknown {
  const assignmentType = formData.get("assignmentType");

  if (assignmentType === "section") {
    return {
      dakId: formData.get("dakId"),
      assignmentType: "section",
      assignmentUnitId: formData.get("assignmentUnitId"),
      remarks: formData.get("remarks") ?? "",
    };
  }

  return {
    dakId: formData.get("dakId"),
    assignmentType: "department",
    departmentId: formData.get("departmentId"),
    remarks: formData.get("remarks") ?? "",
  };
}

/** Assign a DAK to a department or internal section — Collector and ADM only. */
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
      const isCollectorReassign =
        user.role === "collector" &&
        canReassignStatus(existing.status as string);

      if (!isCollectorReassign) {
        return {
          success: false,
          message: canReassignStatus(existing.status as string)
            ? "Only the Collector can reassign DAK that is already in workflow."
            : "Only received DAK entries can be assigned.",
        };
      }
    }

    const isReassign = canReassignStatus(existing.status as string);
    const nextStatus = isReassign ? (existing.status as string) : "assigned";

    let updatePayload: Record<string, unknown> = {
      assigned_by: user.id,
      status: nextStatus,
      assignment_type: parsed.data.assignmentType,
    };

    let logLabel = "";
    const logActionPrefix = isReassign ? "Reassigned" : "Assigned";

    if (parsed.data.assignmentType === "department") {
      const { data: department, error: deptError } = await supabase
        .from("departments")
        .select("name")
        .eq("id", parsed.data.departmentId)
        .maybeSingle();

      if (deptError || !department) {
        return { success: false, message: "Selected department not found." };
      }

      const assignedTo = await getOfficerIdForDepartment(parsed.data.departmentId);

      updatePayload = {
        ...updatePayload,
        department_id: parsed.data.departmentId,
        assignment_unit_id: null,
        assigned_to: assignedTo,
      };
      logLabel = `${logActionPrefix} to ${department.name}`;
    } else {
      const { data: unit, error: unitError } = await supabase
        .from("assignment_units")
        .select("unit_name")
        .eq("id", parsed.data.assignmentUnitId)
        .maybeSingle();

      if (unitError || !unit) {
        return { success: false, message: "Selected section not found." };
      }

      updatePayload = {
        ...updatePayload,
        department_id: null,
        assignment_unit_id: parsed.data.assignmentUnitId,
        assigned_to: null,
      };
      logLabel = `${logActionPrefix} to ${unit.unit_name} (Internal Section)`;
    }

    const { error: updateError } = await supabase
      .from("dak_entries")
      .update(updatePayload)
      .eq("id", parsed.data.dakId);

    if (updateError) {
      console.error("[assignDak]", updateError);
      return {
        success: false,
        message: updateError.message ?? "Failed to assign DAK.",
      };
    }

    const historyEventType =
      parsed.data.assignmentType === "section"
        ? "section_transfer"
        : isReassign
          ? "reassigned"
          : "assigned";

    await logWorkflowAction({
      dakId: parsed.data.dakId,
      userId: user.id,
      eventType: historyEventType,
      action: logLabel,
      remarks:
        parsed.data.remarks?.trim() ||
        `Allocation for ${existing.dak_number}`,
      fromStatus: existing.status as string,
      toStatus: nextStatus,
      metadata: {
        assignment_type: parsed.data.assignmentType,
        is_reassign: isReassign,
      },
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
  const parsed = assignDakSchema.safeParse(parseAssignFormData(formData));

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Invalid form data",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await assignDak(parsed.data);

  if (!result.success) {
    return { message: result.message };
  }

  return {};
}
