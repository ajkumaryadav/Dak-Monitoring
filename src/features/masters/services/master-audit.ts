import { createAdminClient } from "@/lib/supabase/admin";

export async function logMasterDataChange(params: {
  entityType: "department" | "section";
  entityId: string | null;
  action: "create" | "update" | "activate" | "deactivate" | "delete" | "reorder";
  actorId: string;
  actorRole: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from("master_data_audit_logs").insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      actor_id: params.actorId,
      actor_role: params.actorRole,
      previous_value: params.previousValue ?? {},
      new_value: params.newValue ?? {},
    });
  } catch (error) {
    console.error("[logMasterDataChange]", error);
  }
}
