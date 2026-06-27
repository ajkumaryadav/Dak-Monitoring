import { recordHistory } from "@/features/audit/services/dak-history";
import type { DakHistoryEventType } from "@/features/audit/lib/history-events";

interface LogWorkflowParams {
  dakId: string;
  userId: string;
  action: string;
  remarks?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  eventType?: DakHistoryEventType;
  metadata?: Record<string, unknown>;
}

/** Persist a workflow timeline entry — delegates to dak_history audit table. */
export async function logWorkflowAction({
  dakId,
  userId,
  action,
  remarks,
  fromStatus,
  toStatus,
  eventType = "status_changed",
  metadata,
}: LogWorkflowParams): Promise<{ success: boolean; message?: string }> {
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
