"use server";

import { revalidatePath } from "next/cache";

import {
  assignDakSchema,
  type AssignDakInput,
} from "@/features/dak/schemas/assign-schema";
import { canAssignStatus, canReassignStatus } from "@/features/dak/lib/workflow";
import { formatAssignmentLabel } from "@/features/dak/lib/dak-display";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { notifyDakAssignment } from "@/features/notifications/services/notify-dak-event";
import {
  canReassignDakRole,
  hasPermission,
  PERMISSIONS,
} from "@/lib/auth";
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
  revalidatePath("/dashboard/notifications");
}

function parseAssignFormData(formData: FormData): unknown {
  const assignmentType = formData.get("assignmentType");
  const assignedUserId = formData.get("assignedUserId");

  if (assignmentType === "section") {
    return {
      dakId: formData.get("dakId"),
      assignmentType: "section",
      assignmentUnitId: formData.get("assignmentUnitId"),
      assignedUserId,
      remarks: formData.get("remarks") ?? "",
    };
  }

  return {
    dakId: formData.get("dakId"),
    assignmentType: "department",
    departmentId: formData.get("departmentId"),
    assignedUserId,
    remarks: formData.get("remarks") ?? "",
  };
}

async function validateAssignedOfficer(
  assignedUserId: string,
  assignmentType: "department" | "section",
  departmentId?: string,
  sectionId?: string
): Promise<{ ok: true; name: string } | { ok: false; message: string }> {
  const supabase = createAdminClient();

  const { data: officer, error } = await supabase
    .from("users")
    .select("id, name, department_id, section_id, is_active")
    .eq("id", assignedUserId)
    .maybeSingle();

  if (error || !officer) {
    return { ok: false, message: "Selected officer not found." };
  }

  if (officer.is_active === false) {
    return { ok: false, message: "Selected officer account is disabled." };
  }

  if (assignmentType === "department") {
    if (officer.department_id !== departmentId) {
      return {
        ok: false,
        message: "Selected officer does not belong to the chosen department.",
      };
    }
  } else if (officer.section_id !== sectionId) {
    return {
      ok: false,
      message: "Selected officer is not assigned to the chosen section.",
    };
  }

  return { ok: true, name: officer.name as string };
}

/** Assign a DAK to a department/section officer — Collector, ACP, and ADM. */
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
      const canReassign =
        canReassignDakRole(user.role) &&
        canReassignStatus(existing.status as string);

      if (!canReassign) {
        return {
          success: false,
          message: canReassignStatus(existing.status as string)
            ? "Only Collector, ACP, or ADM can reassign DAK already in workflow."
            : "Only received DAK entries can be assigned.",
        };
      }
    }

    const officerCheck = await validateAssignedOfficer(
      parsed.data.assignedUserId,
      parsed.data.assignmentType,
      parsed.data.assignmentType === "department"
        ? parsed.data.departmentId
        : undefined,
      parsed.data.assignmentType === "section"
        ? parsed.data.assignmentUnitId
        : undefined
    );

    if (!officerCheck.ok) {
      return { success: false, message: officerCheck.message };
    }

    const isReassign = canReassignStatus(existing.status as string);
    const nextStatus = isReassign ? (existing.status as string) : "assigned";

    let updatePayload: Record<string, unknown> = {
      assigned_by: user.id,
      assigned_to: parsed.data.assignedUserId,
      status: nextStatus,
      assignment_type: parsed.data.assignmentType,
    };

    let logLabel = "";
    const logActionPrefix = isReassign ? "Reassigned" : "Assigned";
    let targetLabel = "";

    if (parsed.data.assignmentType === "department") {
      const { data: department, error: deptError } = await supabase
        .from("departments")
        .select("name")
        .eq("id", parsed.data.departmentId)
        .maybeSingle();

      if (deptError || !department) {
        return { success: false, message: "Selected department not found." };
      }

      const deptName = department.name as string;
      targetLabel = formatAssignmentLabel(deptName, officerCheck.name);

      updatePayload = {
        ...updatePayload,
        department_id: parsed.data.departmentId,
        assignment_unit_id: null,
      };
      logLabel = `${logActionPrefix} to ${targetLabel}`;
    } else {
      const { data: unit, error: unitError } = await supabase
        .from("assignment_units")
        .select("unit_name")
        .eq("id", parsed.data.assignmentUnitId)
        .maybeSingle();

      if (unitError || !unit) {
        return { success: false, message: "Selected section not found." };
      }

      const sectionName = unit.unit_name as string;
      targetLabel = formatAssignmentLabel(sectionName, officerCheck.name);

      updatePayload = {
        ...updatePayload,
        department_id: null,
        assignment_unit_id: parsed.data.assignmentUnitId,
      };
      logLabel = `${logActionPrefix} to ${targetLabel}`;
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
        assigned_user_id: parsed.data.assignedUserId,
        is_reassign: isReassign,
      },
    });

    await notifyDakAssignment({
      dakId: parsed.data.dakId,
      dakNumber: existing.dak_number as string,
      isReassign,
      assignmentType: parsed.data.assignmentType,
      targetLabel,
      assignedToUserId: parsed.data.assignedUserId,
      actorUserId: user.id,
      actorName: user.name,
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
