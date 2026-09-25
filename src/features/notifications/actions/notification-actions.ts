"use server";

import { z } from "zod";

import {
  getUserNotifications,
  getUnreadNotificationCount,
  markAsRead,
  markAllRead,
} from "@/features/notifications/services/notifications";
import { getSessionUser } from "@/lib/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth";
import { formatSafeErrorMessage, logSafeError } from "@/lib/security/errors";

export async function fetchNotificationCenterData() {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.DASHBOARD)) {
      return { notifications: [], unreadCount: 0 };
    }

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(user, { limit: 100 }),
      getUnreadNotificationCount(user),
    ]);

    return { notifications, unreadCount };
  } catch (err: unknown) {
    logSafeError("fetchNotificationCenterData", err);
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationReadAction(notificationId: string) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, message: "Unauthorized." };
    }

    const validId = z.string().uuid("Invalid notification ID").safeParse(notificationId);
    if (!validId.success) {
      return { success: false, message: "Invalid notification identifier." };
    }

    return await markAsRead(user, notificationId);
  } catch (err: unknown) {
    logSafeError("markNotificationReadAction", err);
    return { success: false, message: formatSafeErrorMessage(err, "Failed to mark notification as read.") };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { success: false, message: "Unauthorized." };
    }

    return await markAllRead(user);
  } catch (err: unknown) {
    logSafeError("markAllNotificationsReadAction", err);
    return { success: false, message: formatSafeErrorMessage(err, "Failed to mark all notifications as read.") };
  }
}

export async function getUnreadCountAction() {
  try {
    const user = await getSessionUser();
    if (!user) return 0;
    return await getUnreadNotificationCount(user);
  } catch (err: unknown) {
    logSafeError("getUnreadCountAction", err);
    return 0;
  }
}
