"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions/notification-actions";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  notifications: NotificationRecord[];
  unreadCount: number;
}

/** Header notification bell with dropdown center. */
export function NotificationBell({
  notifications,
  unreadCount,
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

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
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        {isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Bell className="size-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Notification center"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-[200] w-80 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 sm:w-96"
        >
          <div className="border-b border-border/60 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
                : "You're all caught up"}
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            <NotificationList
              notifications={notifications}
              compact
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
          </div>
          <div className="border-t border-border/60 p-2">
            <Link
              href="/dashboard/notifications"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
              onClick={() => setOpen(false)}
            >
              Open notification center
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** Alias — header dropdown panel for notifications. */
export const NotificationDropdown = NotificationBell;

/** Alias — full notification center lives at /dashboard/notifications. */
export { NotificationsPageClient as NotificationCenter } from "@/features/notifications/components/notifications-page-client";
