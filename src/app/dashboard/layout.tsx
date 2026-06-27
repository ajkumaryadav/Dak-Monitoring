import { AdminShell } from "@/components/layout/admin-shell";
import { AppToaster } from "@/components/ui/sonner";
import { syncUserProfile } from "@/features/auth/actions/sync-user";
import { runSlaMonitor } from "@/jobs/sla-monitor";
import {
  getUnreadNotificationCount,
  getUserNotifications,
} from "@/features/notifications/services/notifications";
import { PERMISSIONS, requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requirePermission(PERMISSIONS.DASHBOARD);

  await syncUserProfile();
  await runSlaMonitor();

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user, { limit: 12 }),
    getUnreadNotificationCount(user),
  ]);

  return (
    <>
      <AdminShell
        user={user}
        notifications={notifications}
        unreadCount={unreadCount}
      >
        {children}
      </AdminShell>
      <AppToaster />
    </>
  );
}

