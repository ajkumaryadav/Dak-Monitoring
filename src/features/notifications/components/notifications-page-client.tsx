"use client";

import { useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";

import { useNotifications } from "@/features/notifications/components/notification-realtime-provider";
import { NotificationList } from "@/features/notifications/components/notification-list";
import {
  canViewAllNotifications,
  type NotificationRecord,
} from "@/features/notifications/lib/notification-models";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/types";

interface NotificationsPageClientProps {
  user: SessionUser;
  initialNotifications: NotificationRecord[];
  initialUnreadCount: number;
}

export function NotificationsPageClient({
  user,
  initialNotifications,
  initialUnreadCount,
}: NotificationsPageClientProps) {
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    isPending,
    hydrateNotifications,
  } = useNotifications();

  const scopeLabel = canViewAllNotifications(user)
    ? "All district notifications"
    : "Your notifications";

  useEffect(() => {
    hydrateNotifications(initialNotifications, initialUnreadCount);
  }, [initialNotifications, initialUnreadCount, hydrateNotifications]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{scopeLabel}</p>
          <p className="text-xs text-muted-foreground">
            Live updates — no refresh required
          </p>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "All notifications read"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={markAllRead}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Bell className="size-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      <NotificationList
        notifications={notifications}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        showActions
      />
    </div>
  );
}

/** Alias — full notification center lives at /dashboard/notifications. */
export { NotificationsPageClient as NotificationCenter };
