import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getRecentActivity } from "@/features/audit/services/dak-history";
import {
  getUnreadNotificationCount,
  getUserNotifications,
} from "@/features/notifications/services/notifications";
import {
  getOverdueDakEntries,
  getHighPriorityDakEntries,
  getImmediateDakEntries,
} from "@/features/notifications/services/notify-dak-event";
import { fetchDashboardAnalytics } from "@/features/reports/services/dashboard-analytics";
import { isDepartmentDashboardRole } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const departmentScope =
    isDepartmentDashboardRole(user.role) && user.departmentId
      ? user.departmentId
      : undefined;

  const [
    analytics,
    recentActivity,
    notifications,
    unreadCount,
    overdueEntries,
    highPriorityEntries,
    immediateEntries,
  ] = await Promise.all([
    fetchDashboardAnalytics(user),
    getRecentActivity(user, 8),
    getUserNotifications(user, { limit: 8 }),
    getUnreadNotificationCount(user),
    getOverdueDakEntries(departmentScope),
    getHighPriorityDakEntries(departmentScope),
    getImmediateDakEntries(departmentScope),
  ]);

  return (
    <DashboardView
      user={user}
      analytics={analytics}
      recentActivity={recentActivity}
      notifications={notifications}
      unreadCount={unreadCount}
      overdueEntries={overdueEntries}
      highPriorityEntries={highPriorityEntries}
      immediateEntries={immediateEntries}
    />
  );
}

