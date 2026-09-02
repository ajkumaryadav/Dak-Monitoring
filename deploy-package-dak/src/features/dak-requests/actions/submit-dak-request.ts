"use server";

import { revalidatePath } from "next/cache";

import {
  DEPARTMENT_REQUEST_STATUSES,
  DAK_REQUEST_TYPE_LABELS,
} from "@/features/dak-requests/lib/request-types";
import {
  submitDakRequestSchema,
  type SubmitDakRequestInput,
} from "@/features/dak-requests/schemas/request-schema";
import {
  hasPendingRequest,
  isDakRequestsTableMissingError,
} from "@/features/dak-requests/services/dak-requests";
import { notifyDakRequestSubmitted } from "@/features/dak-requests/services/notify-dak-request-event";
import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import {
  canUpdateDakStatusRole,
  hasPermission,
  PERMISSIONS,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import { normalizeDakStatus } from "@/features/dak/lib/workflow";

export type SubmitDakRequestResult =
  | { success: true }
  | { success: false; message: string };

function revalidateDak(dakId: string) {
  revalidatePath(`/dashboard/dak/${dakId}`);
  revalidatePath("/dashboard/dak/pending");
  revalidatePath("/dashboard/dak/assigned");
  revalidatePath("/dashboard/dak/pending-approval");
}

export async function submitDakRequest(
  input: SubmitDakRequestInput
): Promise<SubmitDakRequestResult> {
  const user = await getSessionUser();
  if (
    !user ||
    !hasPermission(user.role, PERMISSIONS.DAK_UPDATE) ||
    !canUpdateDakStatusRole(user.role)
  ) {
    return { success: false, message: "Unauthorized." };
  }

  const parsed = submitDakRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid request.",
    };
  }

  const supabase = createAdminClient();
  const { data: dak, error } = await supabase
    .from("dak_entries")
    .select("id, status, dak_number, department_id, assignment_unit_id")
    .eq("id", parsed.data.dakId)
    .maybeSingle();

  if (error || !dak) {
    return { success: false, message: "DAK not found." };
  }

  const normalizedStatus = normalizeDakStatus(dak.status as string);
  if (
    !DEPARTMENT_REQUEST_STATUSES.includes(
      normalizedStatus as (typeof DEPARTMENT_REQUEST_STATUSES)[number]
    )
  ) {
    return {
      success: false,
      message: "Requests can only be submitted while the DAK is in active processing.",
    };
  }

  if (user.role === "section_user" && user.sectionId) {
    if (dak.assignment_unit_id !== user.sectionId) {
      return { success: false, message: "This DAK is not assigned to your section." };
    }
  } else if (
    user.departmentId &&
    dak.department_id &&
    user.departmentId !== dak.department_id
  ) {
    return { success: false, message: "This DAK is not assigned to your department." };
  }

  if (await hasPendingRequest(parsed.data.dakId, parsed.data.requestType)) {
    return {
      success: false,
      message: `A pending ${DAK_REQUEST_TYPE_LABELS[parsed.data.requestType].toLowerCase()} already exists.`,
    };
  }

  const insertPayload: Record<string, unknown> = {
    dak_id: parsed.data.dakId,
    request_type: parsed.data.requestType,
    status: "pending",
    requested_by: user.id,
    remarks: parsed.data.remarks,
  };

  if (parsed.data.requestType === "transfer") {
    insertPayload.target_department_id = parsed.data.targetDepartmentId;
  }

  if (parsed.data.requestType === "extension") {
    insertPayload.requested_due_date = parsed.data.requestedDueDate.slice(0, 10);
  }

  const { error: insertError } = await supabase
    .from("dak_requests")
    .insert(insertPayload);

  if (insertError) {
    if (isDakRequestsTableMissingError(insertError)) {
      return {
        success: false,
        message:
          "Workflow requests are not enabled yet. Ask your administrator to run migration 000031_dak_workflow_requests.sql.",
      };
    }
    return { success: false, message: insertError.message };
  }

  const actionLabel = DAK_REQUEST_TYPE_LABELS[parsed.data.requestType];

  await logWorkflowAction({
    dakId: parsed.data.dakId,
    userId: user.id,
    eventType: "status_changed",
    timelineActionType: "status_changed",
    action: `${actionLabel} Submitted`,
    remarks: parsed.data.remarks,
    fromStatus: dak.status as string,
    toStatus: dak.status as string,
    metadata: {
      request_type: parsed.data.requestType,
      target_department_id:
        parsed.data.requestType === "transfer"
          ? parsed.data.targetDepartmentId
          : null,
      requested_due_date:
        parsed.data.requestType === "extension"
          ? parsed.data.requestedDueDate.slice(0, 10)
          : null,
    },
  });

  await notifyDakRequestSubmitted({
    dakId: parsed.data.dakId,
    dakNumber: dak.dak_number as string,
    requestType: parsed.data.requestType,
    actorUserId: user.id,
    actorName: user.name,
  });

  revalidateDak(parsed.data.dakId);
  return { success: true };
}

export async function submitDakRequestFormAction(
  _prev: { message?: string },
  formData: FormData
) {
  const requestType = formData.get("requestType") as SubmitDakRequestInput["requestType"];

  let input: SubmitDakRequestInput;
  if (requestType === "transfer") {
    input = {
      dakId: formData.get("dakId") as string,
      requestType: "transfer",
      targetDepartmentId: formData.get("targetDepartmentId") as string,
      remarks: formData.get("remarks") as string,
    };
  } else if (requestType === "extension") {
    input = {
      dakId: formData.get("dakId") as string,
      requestType: "extension",
      requestedDueDate: formData.get("requestedDueDate") as string,
      remarks: formData.get("remarks") as string,
    };
  } else if (requestType === "clarification") {
    input = {
      dakId: formData.get("dakId") as string,
      requestType: "clarification",
      remarks: formData.get("remarks") as string,
    };
  } else {
    input = {
      dakId: formData.get("dakId") as string,
      requestType: "escalation",
      remarks: formData.get("remarks") as string,
    };
  }

  const result = await submitDakRequest(input);
  return result.success ? {} : { message: result.message };
}
