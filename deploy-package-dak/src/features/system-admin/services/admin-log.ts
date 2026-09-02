import { createAdminClient } from "@/lib/supabase/admin";

export interface SystemAdminLogInput {
  userId: string | null;
  role: string | null;
  action: string;
  affectedRecords?: number;
  affectedFiles?: number;
  result?: "success" | "failure" | "partial";
  ipAddress?: string | null;
  durationMs?: number | null;
  details?: Record<string, unknown>;
}

/** Permanent audit trail for Database & Storage operations. */
export async function logSystemAdminAction(
  input: SystemAdminLogInput
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("system_admin_logs").insert({
      user_id: input.userId,
      role: input.role,
      action: input.action,
      module: "database_storage",
      affected_records: input.affectedRecords ?? 0,
      affected_files: input.affectedFiles ?? 0,
      result: input.result ?? "success",
      ip_address: input.ipAddress ?? null,
      duration_ms: input.durationMs ?? null,
      details: input.details ?? {},
    });
  } catch (error) {
    console.error("[logSystemAdminAction]", error);
  }
}
