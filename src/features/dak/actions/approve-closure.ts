"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import {
  notifyClosureApproved,
  notifyReturnedForRework,
} from "@/features/dak-requests/services/notify-dak-request-event";
import { canApproveClosure } from "@/features/dak/lib/workflow";
import { isMissingAtrDraftColumnError } from "@/features/remarks/lib/atr-draft-support";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

const approvalSchema = z.object({
  dakId: z.string().uuid(),
  remarks: z.string().max(500).optional(),
});

export type ClosureApprovalResult =
  | { success: true }
  | { success: false; message: string };

function revalidateDak(dakId: string) {
  revalidatePath(`/dashboard/dak/${dakId}`);
  revalidatePath("/dashboard/dak/pending-approval");
  revalidatePath("/dashboard/dak/assigned");
  revalidatePath("/dashboard/dak/completed");
  revalidatePath("/dashboard");
}

function canApproveDakClosureRole(role: string): boolean {
  return role === "collector" || role === "adm";
}

/** Collector/ADM approves closure after ATR review. */
export async function approveDakClosure(
  input: z.infer<typeof approvalSchema>
): Promise<ClosureApprovalResult> {
  const user = await getSessionUser();
  if (!user || !canApproveDakClosureRole(user.role)) {
    return { success: false, message: "Unauthorized." };
  }

  const parsed = approvalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid request." };
  }

  const supabase = createAdminClient();
  const { data: dak, error } = await supabase
    .from("dak_entries")
    .select("id, status, dak_number, assigned_to")
    .eq("id", parsed.data.dakId)
    .maybeSingle();

  if (error || !dak) {
    return { success: false, message: "DAK not found." };
  }

  if (!canApproveClosure(dak.status as string)) {
    return {
      success: false,
      message: "This DAK is not awaiting closure approval.",
    };
  }

  let countQuery = await supabase
    .from("dak_atr")
    .select("id", { count: "exact", head: true })
    .eq("dak_id", parsed.data.dakId)
    .eq("is_draft", false);

  if (countQuery.error && isMissingAtrDraftColumnError(countQuery.error.message)) {
    countQuery = await supabase
      .from("dak_atr")
      .select("id", { count: "exact", head: true })
      .eq("dak_id", parsed.data.dakId);
  }

  const count = countQuery.count;

  if (countQuery.error) {
    return { success: false, message: countQuery.error.message };
  }

  if (!count) {
    return { success: false, message: "An ATR must be submitted before closure." };
  }

  const closedDate = new Date().toISOString().slice(0, 10);

  const { error: updateError } = await supabase
    .from("dak_entries")
    .update({
      status: "closed",
      closed_date: closedDate,
      disposed_date: closedDate,
      updated_by: user.id,
    })
    .eq("id", parsed.data.dakId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  await logWorkflowAction({
    dakId: parsed.data.dakId,
    userId: user.id,
    eventType: "closed",
    timelineActionType: "closed",
    action: "Closure Approved",
    remarks: parsed.data.remarks?.trim() || "Collector approved ATR and closed DAK",
    fromStatus: dak.status as string,
    toStatus: "closed",
  });

  await notifyClosureApproved({
    dakId: parsed.data.dakId,
    dakNumber: dak.dak_number as string,
    assignedToUserId: (dak.assigned_to as string | null) ?? null,
    actorUserId: user.id,
    actorName: user.name,
  });

  revalidateDak(parsed.data.dakId);
  return { success: true };
}

const returnSchema = z.object({
  dakId: z.string().uuid(),
  remarks: z.string().trim().min(5, "Remarks are required when returning for rework"),
});

/** Collector returns DAK to department for correction. */
export async function returnDakForRework(
  input: z.infer<typeof returnSchema>
): Promise<ClosureApprovalResult> {
  const user = await getSessionUser();
  if (!user || !canApproveDakClosureRole(user.role)) {
    return { success: false, message: "Unauthorized." };
  }

  const parsed = returnSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid request.",
    };
  }

  const supabase = createAdminClient();
  const { data: dak, error } = await supabase
    .from("dak_entries")
    .select("id, status, dak_number, assigned_to")
    .eq("id", parsed.data.dakId)
    .maybeSingle();

  if (error || !dak) {
    return { success: false, message: "DAK not found." };
  }

  if (!canApproveClosure(dak.status as string)) {
    return { success: false, message: "This DAK is not in the approval queue." };
  }

  const { error: updateError } = await supabase
    .from("dak_entries")
    .update({
      status: "in_progress",
      updated_by: user.id,
    })
    .eq("id", parsed.data.dakId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  await logWorkflowAction({
    dakId: parsed.data.dakId,
    userId: user.id,
    eventType: "status_changed",
    timelineActionType: "status_changed",
      action: "Returned for Rework",
      remarks: parsed.data.remarks,
      fromStatus: dak.status as string,
      toStatus: "in_progress",
      metadata: { returned_for_rework: true },
  });

  await notifyReturnedForRework({
    dakId: parsed.data.dakId,
    dakNumber: dak.dak_number as string,
    assignedToUserId: (dak.assigned_to as string | null) ?? null,
    actorUserId: user.id,
    actorName: user.name,
    reason: parsed.data.remarks,
  });

  revalidateDak(parsed.data.dakId);
  return { success: true };
}

export type ClosureFormState = { message?: string };

export async function approveClosureFormAction(
  _prev: ClosureFormState,
  formData: FormData
): Promise<ClosureFormState> {
  const result = await approveDakClosure({
    dakId: formData.get("dakId") as string,
    remarks: (formData.get("remarks") as string) ?? "",
  });
  if (result.success) {
    redirect("/dashboard/dak/pending-approval");
  }
  return { message: result.message };
}

export async function returnForReworkFormAction(
  _prev: ClosureFormState,
  formData: FormData
): Promise<ClosureFormState> {
  const result = await returnDakForRework({
    dakId: formData.get("dakId") as string,
    remarks: formData.get("remarks") as string,
  });
  if (result.success) {
    redirect("/dashboard/dak/pending-approval");
  }
  return { message: result.message };
}
