import type { NotificationType } from "@/features/notifications/lib/notification-types";
import { isOperatorDashboardRole } from "@/lib/auth/permissions";
import type { SessionUser } from "@/types";

/** Notification types visible to the DAK Operator (registration-related only). */
export const OPERATOR_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "dak_created",
  "status_updated",
  "password_reset",
  "user_created",
  "user_disabled",
  "user_enabled",
];

export function isOperatorNotificationType(type: NotificationType): boolean {
  return OPERATOR_NOTIFICATION_TYPES.includes(type);
}

export function filterNotificationsForRole<T extends { type: NotificationType }>(
  user: SessionUser,
  records: T[]
): T[] {
  if (!isOperatorDashboardRole(user.role)) {
    return records;
  }

  return records.filter((record) => isOperatorNotificationType(record.type));
}
