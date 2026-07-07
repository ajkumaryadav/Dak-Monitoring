"use server";

import { revalidatePath } from "next/cache";

import {
  DAK_REQUEST_TYPE_LABELS,
  type DakRequestType,
} from "@/features/dak-requests/lib/request-types";
import {
  reviewDakRequestSchema,
  type ReviewDakRequestInput,
} from "@/features/dak-requests/schemas/request-schema";
import { getDakRequestById } from "@/features/dak-requests/services/dak-requests";
import {
  notifyDakRequestReviewed,
} from "@/features/dak-requests/services/notify-dak-request-event";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { hasPermission, PERMISSIONS } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type ReviewDakRequestResult =
  | { success: true }
  | { success: false; message: string };

function canReviewRequests(role: string): boolean {
  return role === "collector" || role === "adm";
}

function revalidateDak(dakId: string) {
  revalidatePath(`/dashboard/dak/${dakId}`);
  revalidatePath("/dashboard/dak/pending");
  revalidatePath("/dashboard/dak/assigned");
  revalidatePath("/dashboard/dak/pending-approval");
  revalidatePath("/dashboard");
}

async function applyApprovedRequest(
  requestType: DakRequestType,
  dakId: string,
  targetDepartmentId: string | null,
  requestedDueDate: string | null,
  reviewRemarks: string,
  reviewerId: string
): Promise<{ ok: true; dakNumber: string; assignedTo: string | null } | { ok: false; message: string }> {
  const supabase = createAdminClient();
  const { data: dak, error } = await supabase
    .from("dak_entries")
    .select("id, status, dak_number, department_id, assigned_to, escalation_level, due_date")
    .eq("id", dakId)
    .maybeSingle();

  if (error || !dak) {
    return { ok: false, message: "DAK not found." };
  }

  const updatePayload: Record<string, unknown> = {
    updated_by: reviewerId,
  };

  if (requestType === "transfer" && targetDepartmentId) {
    updatePayload.department_id = targetDepartmentId;
    updatePayload.assignment_unit_id = null;
    updatePayload.assignment_type = "department";
    updatePayload.status = "assigned";
  } else if (requestType === "escalation") {
    updatePayload.escalation_level = Math.min(
      4,
      ((dak.escalation_level as number) ?? 0) + 1
    );
    updatePayload.status = "pending";
  } else if (requestType === "extension" && requestedDueDate) {
    updatePayload.due_date = requestedDueDate;
    updatePayload.sla_due_date = requestedDueDate;
  }

  const { error: updateError } = await supabase
    .from("dak_entries")
    .update(updatePayload)
    .eq("id", dakId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  if (requestType === "transfer" && targetDepartmentId) {
    await supabase.from("dak_transfers").insert({
      dak_id: dakId,
      action: "transfer_department",
      from_user_id: reviewerId,
      from_department_id: dak.department_id,
      to_department_id: targetDepartmentId,
      remarks: reviewRemarks,
    });
  }

  return {
    ok: true,
    dakNumber: dak.dak_number as string,
    assignedTo: (dak.assigned_to as string | null) ?? null,
  };
}

export async function reviewDakRequest(
  input: ReviewDakRequestInput
): Promise<ReviewDakRequestResult> {
  const user = await getSessionUser();
  if (
    !user ||
    !canReviewRequests(user.role) ||
    !hasPermission(user.role, PERMISSIONS.DAK_ASSIGN)
  ) {
    return { success: false, message: "Unauthorized." };
  }

  const parsed = reviewDakRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid review.",
    };
  }

  const request = await getDakRequestById(parsed.data.requestId);
  if (!request || request.status !== "pending") {
    return { success: false, message: "Request not found or already reviewed." };
  }

  const supabase = createAdminClient();
  const reviewedAt = new Date().toISOString();

  const { error: reviewError } = await supabase
    .from("dak_requests")
    .update({
      status: parsed.data.decision,
      reviewed_by: user.id,
      review_remarks: parsed.data.reviewRemarks,
      reviewed_at: reviewedAt,
    })
    .eq("id", parsed.data.requestId);

  if (reviewError) {
    return { success: false, message: reviewError.message };
  }

  const { data: dak } = await supabase
    .from("dak_entries")
    .select("status, dak_number")
    .eq("id", request.dak_id)
    .maybeSingle();

  const label = DAK_REQUEST_TYPE_LABELS[request.request_type];
  const decisionLabel =
    parsed.data.decision === "approved" ? "Approved" : "Rejected";

  if (parsed.data.decision === "approved") {
    const applied = await applyApprovedRequest(
      request.request_type,
      request.dak_id,
      request.target_department_id,
      request.requested_due_date,
      parsed.data.reviewRemarks,
      user.id
    );

    if (!applied.ok) {
      return { success: false, message: applied.message };
    }
  }

  await logWorkflowAction({
    dakId: request.dak_id,
    userId: user.id,
    eventType: parsed.data.decision === "approved" ? "status_changed" : "remarks_added",
    timelineActionType:
      request.request_type === "escalation" && parsed.data.decision === "approved"
        ? "escalated"
        : "status_changed",
    action: `${label} ${decisionLabel}`,
    remarks: parsed.data.reviewRemarks,
    fromStatus: dak?.status as string | undefined,
    toStatus:
      parsed.data.decision === "approved" && request.request_type === "transfer"
        ? "assigned"
        : dak?.status as string | undefined,
    metadata: {
      request_id: request.id,
      request_type: request.request_type,
      decision: parsed.data.decision,
    },
  });

  await notifyDakRequestReviewed({
    dakId: request.dak_id,
    dakNumber: (dak?.dak_number as string) ?? request.dak_id,
    requestType: request.request_type,
    decision: parsed.data.decision,
    requesterUserId: request.requested_by,
    actorUserId: user.id,
    actorName: user.name,
  });

  revalidateDak(request.dak_id);
  return { success: true };
}

export async function reviewDakRequestFormAction(
  _prev: { message?: string },
  formData: FormData
) {
  const result = await reviewDakRequest({
    requestId: formData.get("requestId") as string,
    decision: formData.get("decision") as "approved" | "rejected",
    reviewRemarks: formData.get("reviewRemarks") as string,
  });
  return result.success ? {} : { message: result.message };
}
