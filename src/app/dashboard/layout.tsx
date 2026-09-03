import { AdminShell } from "@/components/layout/admin-shell";
import { AppToaster } from "@/components/ui/sonner";
import { syncUserProfile } from "@/features/auth/actions/sync-user";
import { getAtrCompliancePendingDakIds } from "@/features/dak/services/get-atr-compliance-received";
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

  try {
    await syncUserProfile();
  } catch (err) {
    console.warn("[DashboardLayout] syncUserProfile warning:", err);
  }

  try {
    await runSlaMonitor();
  } catch (err) {
    console.warn("[DashboardLayout] runSlaMonitor warning:", err);
  }

  const isCollectorQueueRole =
    user.role === "collector" || user.role === "adm";

  const [notifications, unreadCount, atrPendingDakIds] = await Promise.all([
    getUserNotifications(user, { limit: 100 }).catch(() => []),
    getUnreadNotificationCount(user).catch(() => 0),
    isCollectorQueueRole
      ? getAtrCompliancePendingDakIds().catch((error) => {
          console.error("[dashboard layout] ATR compliance queue:", error);
          return [] as string[];
        })
      : Promise.resolve([] as string[]),
  ]);

  return (
    <>
      <AdminShell
        user={user}
        notifications={notifications}
        unreadCount={unreadCount}
        atrPendingDakIds={atrPendingDakIds}
      >
        {children}
      </AdminShell>
      <AppToaster />
    </>
  );
}
