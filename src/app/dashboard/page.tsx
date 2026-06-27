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
import { getUserStats } from "@/features/users/services/get-users";
import {
  isCollectorDashboardRole,
  isDepartmentDashboardRole,
  isOperatorDashboardRole,
  isSectionDashboardRole,
} from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const isOperator = isOperatorDashboardRole(user.role);
  const isDepartment = isDepartmentDashboardRole(user.role);
  const isCollector = isCollectorDashboardRole(user.role);

  const departmentScope =
    isDepartment && user.departmentId ? user.departmentId : undefined;

  const showUserStats = isCollectorDashboardRole(user.role);
  const showDistrictAlerts = isCollector;
  const showScopedAlerts = isDepartment;

  const [
    analytics,
    recentActivity,
    notifications,
    unreadCount,
    overdueEntries,
    highPriorityEntries,
    immediateEntries,
    userStats,
  ] = await Promise.all([
    fetchDashboardAnalytics(user),
    isOperator ? Promise.resolve([]) : getRecentActivity(user, 8),
    getUserNotifications(user, { limit: 8 }),
    getUnreadNotificationCount(user),
    showDistrictAlerts || showScopedAlerts
      ? getOverdueDakEntries(departmentScope)
      : Promise.resolve([]),
    showDistrictAlerts || showScopedAlerts
      ? getHighPriorityDakEntries(departmentScope)
      : Promise.resolve([]),
    showDistrictAlerts || showScopedAlerts
      ? getImmediateDakEntries(departmentScope)
      : Promise.resolve([]),
    showUserStats ? getUserStats() : Promise.resolve(null),
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
      userStats={userStats}
    />
  );
}
