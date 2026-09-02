import { createAdminClient } from "@/lib/supabase/admin";
import { logSystemAdminAction } from "@/features/system-admin/services/admin-log";

export type MaintenanceOp =
  | "vacuum"
  | "analyze"
  | "reindex"
  | "cleanup_logs"
  | "cleanup_temp"
  | "refresh_stats";

/** Safe maintenance operations — vacuum/analyze via DB RPC where available. */
export async function runMaintenance(params: {
  operation: MaintenanceOp;
  userId: string;
  role: string;
}): Promise<{ success: true; message: string } | { success: false; message: string }> {
  const started = Date.now();
  const supabase = createAdminClient();

  try {
    if (
      params.operation === "vacuum" ||
      params.operation === "analyze" ||
      params.operation === "reindex" ||
      params.operation === "refresh_stats"
    ) {
      const op =
        params.operation === "refresh_stats" ? "analyze" : params.operation;
      const { data, error } = await supabase.rpc("run_database_maintenance", {
        op,
      });

      if (error) {
        // Soft-fail when RPC is unavailable — still log
        await logSystemAdminAction({
          userId: params.userId,
          role: params.role,
          action: `Maintenance:${params.operation}`,
          result: "failure",
          durationMs: Date.now() - started,
          details: { message: error.message },
        });
        return {
          success: false,
          message: `${error.message}. Apply migration 000039 if RPC is missing.`,
        };
      }

      await logSystemAdminAction({
        userId: params.userId,
        role: params.role,
        action: `Maintenance:${params.operation}`,
        result: "success",
        durationMs: Date.now() - started,
        details: { rpc: data },
      });

      return {
        success: true,
        message: `${params.operation} completed successfully.`,
      };
    }

    if (params.operation === "cleanup_logs") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 180);
      await supabase
        .from("activity_logs")
        .delete()
        .lt("created_at", cutoff.toISOString());

      await logSystemAdminAction({
        userId: params.userId,
        role: params.role,
        action: "Cleanup Logs",
        result: "success",
        durationMs: Date.now() - started,
        details: { olderThanDays: 180 },
      });

      return { success: true, message: "Activity logs older than 180 days cleaned." };
    }

    if (params.operation === "cleanup_temp") {
      await logSystemAdminAction({
        userId: params.userId,
        role: params.role,
        action: "Cleanup Temporary Files",
        result: "success",
        durationMs: Date.now() - started,
      });
      return {
        success: true,
        message: "Temporary cleanup acknowledged (no temp store configured).",
      };
    }

    return { success: false, message: "Unknown operation." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Maintenance failed",
    };
  }
}
