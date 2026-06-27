/** Notification categories — maps to notifications.type in Postgres. */
export type NotificationType =
  | "dak_created"
  | "dak_assigned"
  | "dak_reassigned"
  | "dak_completed"
  | "status_updated"
  | "dak_overdue";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  dak_created: "New DAK Registered",
  dak_assigned: "DAK Assigned",
  dak_reassigned: "DAK Reassigned",
  dak_completed: "DAK Completed",
  status_updated: "Status Updated",
  dak_overdue: "Overdue DAK",
};

/** Supabase Realtime channel name — subscribe per user in future. */
export const NOTIFICATIONS_REALTIME_CHANNEL = "notifications";
