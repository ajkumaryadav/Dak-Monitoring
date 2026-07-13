"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { CollectorAtrLoginToast } from "@/features/dak/components/collector-atr-login-toast";
import { CollectorAtrProvider } from "@/features/dak/components/collector-atr-provider";
import { NotificationRealtimeProvider } from "@/features/notifications/components/notification-realtime-provider";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import type { SessionUser } from "@/types";

interface AdminShellProps {
  user: SessionUser;
  notifications: NotificationRecord[];
  unreadCount: number;
  atrPendingDakIds?: string[];
  children: React.ReactNode;
}

export function AdminShell({
  user,
  notifications,
  unreadCount,
  atrPendingDakIds = [],
  children,
}: AdminShellProps) {
  const showCollectorAtr =
    user.role === "collector" || user.role === "adm";

  const shell = (
    <NotificationRealtimeProvider
      user={user}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    >
      <SidebarProvider>
        <DashboardSidebar user={user} />
        <SidebarInset className="flex min-h-svh flex-col">
          <TopNavbar user={user} />
          <main className="flex-1 overflow-y-auto bg-muted/30 dark:bg-background">
            <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
              {showCollectorAtr && <CollectorAtrLoginToast />}
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </NotificationRealtimeProvider>
  );

  if (!showCollectorAtr) {
    return shell;
  }

  return (
    <CollectorAtrProvider
      userId={user.id}
      pendingDakIds={atrPendingDakIds}
    >
      {shell}
    </CollectorAtrProvider>
  );
}
