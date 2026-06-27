"use server";

import {
  getUserNotifications,
  getUnreadNotificationCount,
  markAsRead,
  markAllRead,
} from "@/features/notifications/services/notifications";
import { getSessionUser } from "@/lib/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth";

export async function fetchNotificationCenterData() {
  const user = await getSessionUser();
  if (!user || !hasPermission(user.role, PERMISSIONS.DASHBOARD)) {
    return { notifications: [], unreadCount: 0 };
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user, { limit: 100 }),
    getUnreadNotificationCount(user),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationReadAction(notificationId: string) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  return markAsRead(user, notificationId);
}

export async function markAllNotificationsReadAction() {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  return markAllRead(user);
}

export async function getUnreadCountAction() {
  const user = await getSessionUser();
  if (!user) return 0;
  return getUnreadNotificationCount(user);
}
