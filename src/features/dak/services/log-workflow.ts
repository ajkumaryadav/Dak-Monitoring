import { createAdminClient } from "@/lib/supabase/admin";
import type { DakStatus } from "@/types";

interface LogWorkflowParams {
  dakId: string;
  userId: string;
  action: string;
  remarks?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
}

/** Persist a workflow timeline entry for audit and display. */
export async function logWorkflowAction({
  dakId,
  userId,
  action,
  remarks,
  fromStatus,
  toStatus,
}: LogWorkflowParams): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();

  const payload: Record<string, unknown> = {
    dak_id: dakId,
    created_by: userId,
    action,
    remarks: remarks?.trim() || null,
  };

  if (fromStatus) {
    payload.from_status = fromStatus;
  }

  if (toStatus) {
    payload.to_status = toStatus;
  }

  const { error } = await supabase.from("workflow_logs").insert(payload);

  if (error) {
    console.error("[logWorkflowAction]", error);
    return {
      success: false,
      message: error.message ?? "Failed to record workflow log.",
    };
  }

  return { success: true };
}
