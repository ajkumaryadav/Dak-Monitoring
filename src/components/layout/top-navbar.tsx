"use client";

import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import { appConfig } from "@/lib/constants/navigation";
import type { SessionUser } from "@/types";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface TopNavbarProps {
  user: SessionUser;
  notifications: NotificationRecord[];
  unreadCount: number;
}

export function TopNavbar({ user, notifications, unreadCount }: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:gap-4 md:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight">
          {appConfig.fullName}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Collectorate Administration Portal
        </p>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
