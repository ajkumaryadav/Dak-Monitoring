import {
  createNotifications,
  type CreateNotificationInput,
} from "@/features/notifications/services/notifications";
import type { NotificationType } from "@/features/notifications/lib/notification-types";
import {
  DAK_REQUEST_TYPE_LABELS,
  type DakRequestType,
} from "@/features/dak-requests/lib/request-types";
import { createAdminClient } from "@/lib/supabase/admin";

async function getCollectorAdmUserIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data: roles } = await supabase
    .from("roles")
    .select("id, slug")
    .in("slug", ["collector", "adm"]);

  if (!roles?.length) return [];

  const roleIds = roles.map((r) => r.id as string);
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .eq("is_active", true)
    .in("role_id", roleIds);

  return (users ?? []).map((u) => u.id as string);
}

async function sendNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  if (!inputs.length) return;
  try {
    await createNotifications(inputs);
  } catch (error) {
    console.error("[notifyDakRequestEvent]", error);
  }
}

function requestNotificationType(
  requestType: DakRequestType,
  phase: "requested" | "approved" | "rejected" | "resolved"
): NotificationType {
  const map: Record<DakRequestType, Record<string, NotificationType>> = {
    transfer: {
      requested: "transfer_requested",
      approved: "transfer_approved",
      rejected: "transfer_rejected",
      resolved: "transfer_approved",
    },
    escalation: {
      requested: "escalation_requested",
      approved: "escalation_resolved",
      rejected: "escalation_resolved",
      resolved: "escalation_resolved",
    },
    extension: {
      requested: "extension_requested",
      approved: "extension_approved",
      rejected: "extension_rejected",
      resolved: "extension_approved",
    },
  };

  return map[requestType][phase];
}

export async function notifyDakRequestSubmitted(params: {
  dakId: string;
  dakNumber: string;
  requestType: DakRequestType;
  actorUserId: string;
  actorName: string;
}): Promise<void> {
  const reviewers = await getCollectorAdmUserIds();
  const type = requestNotificationType(params.requestType, "requested");
  const label = DAK_REQUEST_TYPE_LABELS[params.requestType];

  await sendNotifications(
    [...new Set([params.actorUserId, ...reviewers])].map((userId) => ({
      userId,
      type,
      title: `${label} Submitted`,
      body: `${label} for ${params.dakNumber} by ${params.actorName}.`,
      dakId: params.dakId,
      metadata: { request_type: params.requestType },
    }))
  );
}

export async function notifyDakRequestReviewed(params: {
  dakId: string;
  dakNumber: string;
  requestType: DakRequestType;
  decision: "approved" | "rejected";
  requesterUserId: string;
  actorUserId: string;
  actorName: string;
}): Promise<void> {
  const type = requestNotificationType(
    params.requestType,
    params.decision === "approved" ? "approved" : "rejected"
  );
  const label = DAK_REQUEST_TYPE_LABELS[params.requestType];
  const verb = params.decision === "approved" ? "approved" : "rejected";

  await sendNotifications(
    [...new Set([params.requesterUserId, params.actorUserId])].map((userId) => ({
      userId,
      type,
      title: `${label} ${verb.charAt(0).toUpperCase()}${verb.slice(1)}`,
      body: `${label} for ${params.dakNumber} was ${verb} by ${params.actorName}.`,
      dakId: params.dakId,
      metadata: {
        request_type: params.requestType,
        decision: params.decision,
      },
    }))
  );
}

export async function notifyClosureApproved(params: {
  dakId: string;
  dakNumber: string;
  assignedToUserId: string | null;
  actorUserId: string;
  actorName: string;
}): Promise<void> {
  const recipients = [
    params.actorUserId,
    params.assignedToUserId,
  ].filter(Boolean) as string[];

  await sendNotifications(
    [...new Set(recipients)].map((userId) => ({
      userId,
      type: "closure_approved",
      title: "Closure Approved",
      body: `DAK ${params.dakNumber} has been closed by ${params.actorName}.`,
      dakId: params.dakId,
      metadata: {},
    }))
  );
}
