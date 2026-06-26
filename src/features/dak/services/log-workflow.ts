import { createAdminClient } from "@/lib/supabase/admin";

interface LogWorkflowParams {
  dakId: string;
  userId: string;
  action: string;
  remarks?: string | null;
}

/** Persist a workflow timeline entry for audit and display. */
export async function logWorkflowAction({
  dakId,
  userId,
  action,
  remarks,
}: LogWorkflowParams): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("workflow_logs").insert({
    dak_id: dakId,
    created_by: userId,
    action,
    remarks: remarks?.trim() || null,
  });

  if (error) {
    console.error("[logWorkflowAction]", error);
    return {
      success: false,
      message: error.message ?? "Failed to record workflow log.",
    };
  }

  return { success: true };
}
