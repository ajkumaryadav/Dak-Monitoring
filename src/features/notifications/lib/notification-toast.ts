import { toast } from "sonner";

import type { NotificationType } from "@/features/notifications/lib/notification-types";
import type { NotificationRecord } from "@/features/notifications/services/notifications";

const TOAST_ENABLED_TYPES = new Set<NotificationType>([
  "dak_created",
  "dak_assigned",
  "dak_reassigned",
  "atr_submitted",
  "remark_added",
  "dak_overdue",
  "dak_escalated",
  "sla_due_tomorrow",
  "status_updated",
  "dak_completed",
]);

const TOAST_TITLES: Partial<Record<NotificationType, string>> = {
  dak_created: "New DAK Received",
  dak_assigned: "New DAK Assigned",
  dak_reassigned: "DAK Reassigned",
  atr_submitted: "ATR Submitted",
  remark_added: "New Remark Added",
  dak_overdue: "DAK Overdue",
  dak_escalated: "DAK Escalated",
  sla_due_tomorrow: "SLA Due Tomorrow",
  status_updated: "DAK Status Updated",
  dak_completed: "DAK Disposed",
};

/** Show Sonner toast for important realtime notification events. */
export function showNotificationToast(notification: NotificationRecord): void {
  if (!TOAST_ENABLED_TYPES.has(notification.type)) return;

  const title = TOAST_TITLES[notification.type] ?? notification.title;
  const isNewDak = notification.type === "dak_created";

  const toastFn = isNewDak ? toast.warning : toast;

  toastFn(title, {
    description: notification.body,
    duration: isNewDak ? 12000 : 5000,
    ...(isNewDak
      ? {
          action: {
            label: "Open",
            onClick: () => {
              window.location.href = notification.dakId
                ? `/dashboard/dak/${notification.dakId}`
                : "/dashboard/dak/assignments";
            },
          },
        }
      : {}),
  });
}
