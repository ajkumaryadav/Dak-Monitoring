"use server";

import { revalidatePath } from "next/cache";

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
    getUserNotifications(user, { limit: 12 }),
    getUnreadNotificationCount(user),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationReadAction(notificationId: string) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  const result = await markAsRead(user, notificationId);

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
  }

  return result;
}

export async function markAllNotificationsReadAction() {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  const result = await markAllRead(user);

  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
  }

  return result;
}

export async function getUnreadCountAction() {
  const user = await getSessionUser();
  if (!user) return 0;
  return getUnreadNotificationCount(user);
}
