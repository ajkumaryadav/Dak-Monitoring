"use server";

import { revalidatePath } from "next/cache";

import { createActivityLog } from "@/features/activity/services/activity-log";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { isOperatorDashboardRole } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RecallDakInput {
  dakId: string;
  reason?: string;
}

export type RecallDakResult =
  | { success: true; message: string }
  | { success: false; message: string };

/**
 * Recall DAK by the DAK Operator who registered it if accidentally forwarded.
 * Resets status to "received", clears active officer/department assignments,
 * and records a timeline event + audit log.
 */
export async function recallDak(input: RecallDakInput): Promise<RecallDakResult> {
  try {
    const user = await getSessionUser();

    if (!user) {
      return {
        success: false,
        message: "Your session has expired. Please sign in again.",
      };
    }

    if (!isOperatorDashboardRole(user.role)) {
      return {
        success: false,
        message: "Only DAK Operators have permission to recall registered DAK.",
      };
    }

    if (!input.dakId?.trim()) {
      return {
        success: false,
        message: "Invalid DAK ID provided.",
      };
    }

    const supabase = createAdminClient();

    // Fetch DAK entry and verify eligibility
    const { data: dak, error: fetchError } = await supabase
      .from("dak_entries")
      .select("id, dak_number, subject, status, created_by, department_id, assignment_unit_id, assigned_to")
      .eq("id", input.dakId)
      .maybeSingle();

    if (fetchError || !dak) {
      return {
        success: false,
        message: "DAK entry not found.",
      };
    }

    // Must be created by this operator (or if operator role)
    if (dak.created_by && dak.created_by !== user.id) {
      return {
        success: false,
        message: "You can only recall DAK entries registered from your account.",
      };
    }

    // Can only recall if not finalized or completed
    const allowedRecallStatuses = ["received", "assigned", "under_process", "in_progress"];
    if (!allowedRecallStatuses.includes(dak.status as string)) {
      return {
        success: false,
        message: `Cannot recall DAK with current status "${dak.status}". It has already advanced past initial assignment.`,
      };
    }

    // Check if any ATR compliance has already been approved
    const { data: atrRows } = await supabase
      .from("dak_atr")
      .select("id, status")
      .eq("dak_id", input.dakId);

    const hasApprovedAtr = atrRows?.some(
      (a) => a.status === "approved" || a.status === "closed"
    );
    if (hasApprovedAtr) {
      return {
        success: false,
        message: "Cannot recall DAK because Action Taken Report (ATR) has already been approved.",
      };
    }

    const recallReason = input.reason?.trim() || "Accidental forwarding / correction of registry details";

    // Update DAK entry to recall it to registry intake
    const { error: updateError } = await supabase
      .from("dak_entries")
      .update({
        status: "received",
        department_id: null,
        assignment_unit_id: null,
        assignment_type: null,
        assigned_to: null,
        assigned_by: null,
        due_date: null,
        sla_due_date: null,
        escalation_level: 0,
      })
      .eq("id", input.dakId);

    if (updateError) {
      console.error("[recallDak]", updateError);
      return {
        success: false,
        message: updateError.message ?? "Failed to update DAK status.",
      };
    }

    // Log timeline event
    await logWorkflowAction({
      dakId: input.dakId,
      userId: user.id,
      eventType: "status_changed",
      timelineActionType: "status_changed",
      action: "DAK Recalled by Registry Operator",
      remarks: `Recalled to registry: ${recallReason}`,
      fromStatus: dak.status as string,
      toStatus: "received",
      metadata: {
        recalled_by_operator: true,
        return_to_registry: true,
        previous_status: dak.status,
        reason: recallReason,
      },
    });

    // Log activity
    await createActivityLog({
      userId: user.id,
      action: "DAK Recall",
      module: "dak",
      description: `Operator ${user.name} recalled ${dak.dak_number} to registry: ${recallReason}`,
      metadata: {
        dak_id: input.dakId,
        dak_number: dak.dak_number,
        previous_status: dak.status,
        reason: recallReason,
      },
    });

    revalidatePath("/dashboard/dak");
    revalidatePath("/dashboard/dak/assignments");
    revalidatePath(`/dashboard/dak/${input.dakId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/audit");
    revalidatePath("/dashboard/notifications");

    return {
      success: true,
      message: `DAK ${dak.dak_number} has been recalled to your registry.`,
    };
  } catch (error) {
    console.error("[recallDak]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while recalling DAK.",
    };
  }
}
