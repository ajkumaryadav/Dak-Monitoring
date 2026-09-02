"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { CollectorAtrLoginToast } from "@/features/dak/components/collector-atr-login-toast";
import { CollectorAtrProvider } from "@/features/dak/components/collector-atr-provider";
import { DakAssignedLoginToast } from "@/features/notifications/components/dak-assigned-login-toast";
import { NewDakReceivedToast } from "@/features/notifications/components/new-dak-received-toast";
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
  const showNewDakToast =
    user.role === "collector" ||
    user.role === "adm" ||
    user.role === "acp";
  const showAssignedToast =
    user.role === "department_user" || user.role === "section_user";
  /** Keep ATR context available for sidebar badge consumers on district roles. */
  const wrapAtrProvider =
    user.role === "collector" ||
    user.role === "adm" ||
    user.role === "acp";

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
            <div className="mx-auto w-full max-w-[1720px] p-4 md:p-6 lg:px-8">
              {showCollectorAtr && <CollectorAtrLoginToast />}
              {showNewDakToast && <NewDakReceivedToast role={user.role} />}
              {showAssignedToast && (
                <DakAssignedLoginToast role={user.role} />
              )}
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </NotificationRealtimeProvider>
  );

  if (!wrapAtrProvider) {
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
