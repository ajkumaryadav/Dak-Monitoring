/** Timeline action types stored in dak_timeline.action_type. */
export type DakTimelineActionType =
  | "dak_created"
  | "dak_assigned"
  | "dak_reassigned"
  | "status_changed"
  | "remark_added"
  | "file_uploaded"
  | "atr_submitted"
  | "closed";

export const TIMELINE_ACTION_LABELS: Record<DakTimelineActionType, string> = {
  dak_created: "DAK Created",
  dak_assigned: "DAK Assigned",
  dak_reassigned: "DAK Reassigned",
  status_changed: "Status Changed",
  remark_added: "Remark Added",
  file_uploaded: "File Uploaded",
  atr_submitted: "ATR Submitted",
  closed: "Closed",
};

export function getTimelineActionLabel(type: DakTimelineActionType): string {
  return TIMELINE_ACTION_LABELS[type] ?? type;
}
