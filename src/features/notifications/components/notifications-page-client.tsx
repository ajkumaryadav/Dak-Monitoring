"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, Loader2 } from "lucide-react";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/features/notifications/actions/notification-actions";
import { NotificationList } from "@/features/notifications/components/notification-list";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import { Button } from "@/components/ui/button";
import { canViewAllNotifications } from "@/features/notifications/services/notifications";
import type { SessionUser } from "@/types";

interface NotificationsPageClientProps {
  user: SessionUser;
  notifications: NotificationRecord[];
  unreadCount: number;
}

export function NotificationsPageClient({
  user,
  notifications,
  unreadCount,
}: NotificationsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const scopeLabel = canViewAllNotifications(user)
    ? "All district notifications"
    : "Your notifications";

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{scopeLabel}</p>
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
            onClick={handleMarkAllRead}
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
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        showActions
      />
    </div>
  );
}
