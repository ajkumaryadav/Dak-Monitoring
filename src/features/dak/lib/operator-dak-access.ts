import type { DakAttachmentWithUrl } from "@/features/dak/actions/upload-attachment";
import type { DakTimelineEvent } from "@/features/timeline/services/timeline";
import type { DakTimelineActionType } from "@/features/timeline/lib/timeline-types";
import { isOperatorDashboardRole } from "@/lib/auth/permissions";
import type { SessionUser } from "@/types";

/** Timeline actions visible to the DAK Operator (registry clerk). */
export const OPERATOR_VISIBLE_TIMELINE_ACTIONS: readonly DakTimelineActionType[] = [
  "dak_created",
  "file_uploaded",
];

export function isOperatorDakViewer(user: SessionUser): boolean {
  return isOperatorDashboardRole(user.role);
}

/** Whether a timeline row may be shown to the operator. */
export function isOperatorVisibleTimelineEvent(
  event: DakTimelineEvent
): boolean {
  if (OPERATOR_VISIBLE_TIMELINE_ACTIONS.includes(event.actionType)) {
    return true;
  }

  if (event.actionType === "status_changed") {
    return event.metadata?.return_to_registry === true;
  }

  return false;
}

/** Keep only registration-phase timeline events for the operator. */
export function filterTimelineForOperator(
  events: DakTimelineEvent[]
): DakTimelineEvent[] {
  const visible = events.filter(isOperatorVisibleTimelineEvent);

  const hasForwardedMarker = visible.some(
    (event) =>
      event.actionType === "status_changed" &&
      event.metadata?.forwarded_to_collector === true
  );

  const registrationComplete = visible.some(
    (event) => event.actionType === "dak_created"
  );

  if (registrationComplete && !hasForwardedMarker) {
    const registrationEvent = visible.find(
      (event) => event.actionType === "dak_created"
    );
    if (registrationEvent) {
      visible.push({
        id: `${registrationEvent.id}-forwarded`,
        dakId: registrationEvent.dakId,
        actionType: "status_changed",
        actionTitle: "Forwarded to Collector",
        description:
          "Registered DAK forwarded to Collector/ADM for examination and assignment.",
        metadata: { forwarded_to_collector: true },
        createdAt: registrationEvent.createdAt,
        performerName: registrationEvent.performerName,
        performerRole: registrationEvent.performerRole,
      });
    }
  }

  return visible.sort((a, b) => {
    const timeDiff =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return b.id.localeCompare(a.id);
  });
}

/**
 * Registration uploads only — attachments uploaded by the registrar before
 * Collector assignment, or all attachments when the DAK is still at intake.
 */
export function filterAttachmentsForOperator(
  attachments: DakAttachmentWithUrl[],
  registrarId: string | null,
  assignmentAt: string | null
): DakAttachmentWithUrl[] {
  if (!attachments.length) {
    return [];
  }

  return attachments.filter((attachment) => {
    if (registrarId && attachment.uploaded_by) {
      return attachment.uploaded_by === registrarId;
    }

    if (assignmentAt) {
      return attachment.created_at <= assignmentAt;
    }

    return true;
  });
}

/** Find the first Collector assignment timestamp for attachment scoping. */
export function findFirstAssignmentTimestamp(
  events: DakTimelineEvent[]
): string | null {
  const assignment = events.find(
    (event) =>
      event.actionType === "dak_assigned" ||
      (event.actionType === "status_changed" &&
        event.metadata?.to_status === "assigned")
  );

  return assignment?.createdAt ?? null;
}

export interface OperatorReturnNotice {
  title: string;
  body: string;
  createdAt: string;
}

/** Return-for-correction notice — only registry-related feedback. */
export function extractOperatorReturnNotice(
  events: DakTimelineEvent[]
): OperatorReturnNotice | null {
  const event = events.find(
    (entry) =>
      entry.actionType === "status_changed" &&
      entry.metadata?.return_to_registry === true
  );

  if (!event) {
    return null;
  }

  return {
    title: event.actionTitle || "Returned for Correction",
    body:
      event.description?.trim() ||
      "Please review the registration details and resubmit.",
    createdAt: event.createdAt,
  };
}
