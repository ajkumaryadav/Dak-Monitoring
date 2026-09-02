import { recordHistory } from "@/features/audit/services/dak-history";
import type { DakHistoryEventType } from "@/features/audit/lib/history-events";
import {
  createTimelineEvent,
  mapHistoryEventToTimelineAction,
} from "@/features/timeline/services/timeline";
import type { DakTimelineActionType } from "@/features/timeline/lib/timeline-types";

interface LogWorkflowParams {
  dakId: string;
  userId: string;
  action: string;
  remarks?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  eventType?: DakHistoryEventType;
  timelineActionType?: DakTimelineActionType;
  metadata?: Record<string, unknown>;
}

/** Persist workflow history and dak_timeline entry. */
export async function logWorkflowAction({
  dakId,
  userId,
  action,
  remarks,
  fromStatus,
  toStatus,
  eventType = "status_changed",
  timelineActionType,
  metadata,
}: LogWorkflowParams): Promise<{ success: boolean; message?: string }> {
  const timelineType =
    timelineActionType ?? mapHistoryEventToTimelineAction(eventType, action);

  const timelineMetadata = {
    ...metadata,
    ...(fromStatus ? { from_status: fromStatus } : {}),
    ...(toStatus ? { to_status: toStatus } : {}),
  };

  await createTimelineEvent({
    dakId,
    actionType: timelineType,
    actionTitle: action,
    description: remarks,
    performedBy: userId,
    metadata: timelineMetadata,
  });

  return recordHistory({
    dakId,
    performedBy: userId,
    eventType,
    actionLabel: action,
    remarks,
    fromStatus,
    toStatus,
    metadata,
  });
}
