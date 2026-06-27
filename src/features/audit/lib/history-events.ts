/** Canonical DAK history event types stored in dak_history.event_type. */
export type DakHistoryEventType =
  | "dak_registered"
  | "assigned"
  | "reassigned"
  | "status_changed"
  | "section_transfer"
  | "remarks_added"
  | "completed"
  | "closed";

export const DAK_HISTORY_EVENT_LABELS: Record<DakHistoryEventType, string> = {
  dak_registered: "DAK Registered",
  assigned: "Assigned",
  reassigned: "Reassigned",
  status_changed: "Status Changed",
  section_transfer: "Section Transfer",
  remarks_added: "Remarks Added",
  completed: "Completed",
  closed: "Closed",
};

export function getHistoryEventLabel(eventType: DakHistoryEventType): string {
  return DAK_HISTORY_EVENT_LABELS[eventType] ?? eventType;
}
