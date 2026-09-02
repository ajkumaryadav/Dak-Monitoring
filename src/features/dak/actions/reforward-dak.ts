"use server";

import { revalidatePath } from "next/cache";

import { createActivityLog } from "@/features/activity/services/activity-log";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { isOperatorDashboardRole } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ReforwardDakInput {
  dakId: string;
}

export type ReforwardDakResult =
  | { success: true; message: string }
  | { success: false; message: string };

/**
 * Re-forward a recalled DAK to the Collector/ADM for examination and assignment.
 */
export async function reforwardDak(input: ReforwardDakInput): Promise<ReforwardDakResult> {
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
        message: "Only DAK Operators can forward correspondence to Collector.",
      };
    }

    const supabase = createAdminClient();

    const { data: dak, error: fetchError } = await supabase
      .from("dak_entries")
      .select("id, dak_number, subject, created_by")
      .eq("id", input.dakId)
      .maybeSingle();

    if (fetchError || !dak) {
      return {
        success: false,
        message: "DAK entry not found.",
      };
    }

    if (dak.created_by && dak.created_by !== user.id) {
      return {
        success: false,
        message: "You can only forward DAK entries registered from your account.",
      };
    }

    // Update status to received
    const { error: updateError } = await supabase
      .from("dak_entries")
      .update({
        status: "received",
      })
      .eq("id", input.dakId);

    if (updateError) {
      console.error("[reforwardDak]", updateError);
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
      action: "Forwarded to Collector",
      remarks: "DAK re-forwarded to Collector/ADM for examination and assignment.",
      fromStatus: "received",
      toStatus: "received",
      metadata: {
        forwarded_to_collector: true,
        recalled_by_operator: false,
        return_to_registry: false,
      },
    });

    // Log activity
    await createActivityLog({
      userId: user.id,
      action: "DAK Forward",
      module: "dak",
      description: `Operator ${user.name} re-forwarded ${dak.dak_number} to Collector`,
      metadata: {
        dak_id: input.dakId,
        dak_number: dak.dak_number,
      },
    });

    revalidatePath("/dashboard/dak");
    revalidatePath(`/dashboard/dak/${input.dakId}`);
    revalidatePath("/dashboard/dak/assignments");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/audit");
    revalidatePath("/dashboard/notifications");

    return {
      success: true,
      message: `DAK ${dak.dak_number} has been forwarded to Collector/ADM.`,
    };
  } catch (error) {
    console.error("[reforwardDak]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while forwarding DAK.",
    };
  }
}
