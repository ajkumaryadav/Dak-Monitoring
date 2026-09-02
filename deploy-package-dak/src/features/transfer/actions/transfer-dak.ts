"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { normalizeDakStatus } from "@/features/dak/lib/workflow";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { notifyDakStatusChange } from "@/features/notifications/services/notify-dak-event";
import { canPerformTransfer } from "@/features/transfer/lib/transfer-permissions";
import type { TransferAction } from "@/features/transfer/lib/transfer-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

const transferSchema = z.object({
  dakId: z.string().uuid(),
  action: z.enum([
    "forward_adm",
    "forward_collector",
    "transfer_department",
    "return_clarification",
    "manual_escalate",
    "adm_guidance",
  ]),
  toDepartmentId: z.string().uuid().optional(),
  remarks: z.string().trim().min(5, "Remarks are mandatory for transfer actions"),
});

export type TransferDakResult =
  | { success: true }
  | { success: false; message: string };

export async function transferDak(
  input: z.infer<typeof transferSchema>
): Promise<TransferDakResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid transfer request.",
    };
  }

  if (!canPerformTransfer(user, parsed.data.action)) {
    return { success: false, message: "You cannot perform this transfer action." };
  }

  if (
    parsed.data.action === "transfer_department" &&
    !parsed.data.toDepartmentId
  ) {
    return { success: false, message: "Select a target department." };
  }

  const supabase = createAdminClient();
  const { data: dak, error } = await supabase
    .from("dak_entries")
    .select("id, status, dak_number, department_id, assigned_to, escalation_level")
    .eq("id", parsed.data.dakId)
    .maybeSingle();

  if (error || !dak) {
    return { success: false, message: "DAK not found." };
  }

  if (
    user.departmentId &&
    dak.department_id &&
    user.departmentId !== dak.department_id &&
    (user.role === "department_user" || user.role === "section_user")
  ) {
    return { success: false, message: "This DAK is not in your department." };
  }

  const updatePayload: Record<string, unknown> = {
    updated_by: user.id,
  };

  if (parsed.data.action === "transfer_department" && parsed.data.toDepartmentId) {
    updatePayload.department_id = parsed.data.toDepartmentId;
    updatePayload.status = "assigned";
  } else if (parsed.data.action === "return_clarification") {
    updatePayload.status = "pending";
  } else if (parsed.data.action === "manual_escalate") {
    updatePayload.escalation_level = Math.min(
      4,
      ((dak.escalation_level as number) ?? 0) + 1
    );
    updatePayload.status = "pending";
  } else if (
    parsed.data.action === "forward_adm" ||
    parsed.data.action === "forward_collector"
  ) {
    updatePayload.status = "pending";
  }

  const { error: updateError } = await supabase
    .from("dak_entries")
    .update(updatePayload)
    .eq("id", parsed.data.dakId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  await supabase.from("dak_transfers").insert({
    dak_id: parsed.data.dakId,
    action: parsed.data.action,
    from_user_id: user.id,
    from_department_id: user.departmentId,
    to_department_id: parsed.data.toDepartmentId ?? null,
    remarks: parsed.data.remarks,
  });

  const actionLabel =
    parsed.data.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  await logWorkflowAction({
    dakId: parsed.data.dakId,
    userId: user.id,
    eventType: parsed.data.action === "manual_escalate" ? "status_changed" : "reassigned",
    timelineActionType:
      parsed.data.action === "manual_escalate" ? "escalated" : "dak_reassigned",
    action: actionLabel,
    remarks: parsed.data.remarks,
    fromStatus: dak.status as string,
    toStatus: normalizeDakStatus(
      (updatePayload.status as string) ?? (dak.status as string)
    ),
    metadata: {
      transfer_action: parsed.data.action,
      to_department_id: parsed.data.toDepartmentId ?? null,
    },
  });

  await notifyDakStatusChange({
    dakId: parsed.data.dakId,
    dakNumber: dak.dak_number as string,
    fromStatus: dak.status as string,
    toStatus: normalizeDakStatus(
      (updatePayload.status as string) ?? (dak.status as string)
    ),
    assignedToUserId: (dak.assigned_to as string | null) ?? null,
    actorUserId: user.id,
    actorName: user.name,
  });

  revalidatePath(`/dashboard/dak/${parsed.data.dakId}`);
  revalidatePath("/dashboard/dak/pending");
  revalidatePath("/dashboard/dak/assigned");
  return { success: true };
}

export async function transferDakFormAction(
  _prev: { message?: string },
  formData: FormData
) {
  const toDept = formData.get("toDepartmentId");
  const result = await transferDak({
    dakId: formData.get("dakId") as string,
    action: formData.get("action") as TransferAction,
    toDepartmentId: toDept ? (toDept as string) : undefined,
    remarks: formData.get("remarks") as string,
  });
  return result.success ? {} : { message: result.message };
}
