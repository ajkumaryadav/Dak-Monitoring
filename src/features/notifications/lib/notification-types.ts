/** Notification categories — maps to notifications.type in Postgres. */
export type NotificationType =
  | "dak_created"
  | "dak_assigned"
  | "dak_reassigned"
  | "dak_completed"
  | "status_updated"
  | "dak_overdue"
  | "sla_due_tomorrow"
  | "dak_escalated"
  | "user_created"
  | "password_reset"
  | "user_disabled"
  | "user_enabled"
  | "remark_added"
  | "atr_submitted";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  dak_created: "New DAK Registered",
  dak_assigned: "DAK Assigned",
  dak_reassigned: "DAK Reassigned",
  dak_completed: "DAK Completed",
  status_updated: "Status Updated",
  dak_overdue: "Overdue DAK",
  sla_due_tomorrow: "SLA Due Tomorrow",
  dak_escalated: "DAK Escalated",
  user_created: "User Created",
  password_reset: "Password Reset",
  user_disabled: "User Disabled",
  user_enabled: "User Enabled",
  remark_added: "Remark Added",
  atr_submitted: "ATR Submitted",
};

/** Supabase Realtime channel name — subscribe per user in future. */
export const NOTIFICATIONS_REALTIME_CHANNEL = "notifications";
