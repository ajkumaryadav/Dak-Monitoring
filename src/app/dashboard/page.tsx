import { redirect } from "next/navigation";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getRecentActivity } from "@/features/audit/services/dak-history";
import {
  getUnreadNotificationCount,
  getUserNotifications,
} from "@/features/notifications/services/notifications";
import {
  getHighPriorityDakEntries,
  getImmediateDakEntries,
} from "@/features/notifications/services/notify-dak-event";
import { fetchSlaDashboardData } from "@/features/sla/services/sla-report";
import { fetchDashboardAnalytics } from "@/features/reports/services/dashboard-analytics";
import { canAccessDatabaseStorage } from "@/features/system-admin/lib/permissions";
import { listBackups } from "@/features/system-admin/services/backup";
import { previewOrphans } from "@/features/system-admin/services/orphan-cleaner";
import {
  fetchDatabaseStats,
  fetchStorageStats,
} from "@/features/system-admin/services/stats";
import { getUserStats } from "@/features/users/services/get-users";
import { getTaskStats } from "@/features/tasks/services/tasks";
import {
  canManageUsers,
  isCollectorDashboardRole,
  isDepartmentDashboardRole,
  isOperatorDashboardRole,
  isSectionDashboardRole,
} from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const isOperator = isOperatorDashboardRole(user.role);
  const isDepartment = isDepartmentDashboardRole(user.role);
  const isSection = isSectionDashboardRole(user.role);

  const departmentScope =
    (isDepartment || isSection) && user.departmentId
      ? user.departmentId
      : undefined;

  const showUserStats = canManageUsers(user.role);
  const showDistrictAlerts = isCollectorDashboardRole(user.role);
  const showScopedAlerts = isDepartment;
  const showTaskStats =
    user.role === "collector" ||
    user.role === "acp" ||
    user.role === "adm" ||
    isDepartment ||
    isSection;
  const showSystemHealth = canAccessDatabaseStorage(user.role);

  const taskScope = isSection
    ? { assignedTo: user.id }
    : isDepartment && user.departmentId
      ? { departmentId: user.departmentId }
      : undefined;

  const [
    analytics,
    recentActivity,
    notifications,
    unreadCount,
    slaData,
    highPriorityEntries,
    immediateEntries,
    userStats,
    taskStats,
    systemHealthBundle,
  ] = await Promise.all([
    fetchDashboardAnalytics(user),
    isOperator ? Promise.resolve([]) : getRecentActivity(user, 3),
    getUserNotifications(user, { limit: 3 }),
    getUnreadNotificationCount(user),
    showDistrictAlerts || showScopedAlerts
      ? fetchSlaDashboardData(user)
      : Promise.resolve({
          overdueEntries: [],
          escalatedEntries: [],
          dueTodayEntries: [],
          dueSoonEntries: [],
        }),
    showDistrictAlerts || showScopedAlerts
      ? getHighPriorityDakEntries(departmentScope)
      : Promise.resolve([]),
    showDistrictAlerts || showScopedAlerts
      ? getImmediateDakEntries(departmentScope)
      : Promise.resolve([]),
    showUserStats ? getUserStats() : Promise.resolve(null),
    showTaskStats ? getTaskStats(taskScope) : Promise.resolve(null),
    showSystemHealth
      ? Promise.all([
          fetchDatabaseStats(),
          fetchStorageStats(),
          listBackups(),
          user.role === "acp"
            ? previewOrphans()
            : Promise.resolve({
                orphanDbRecords: [],
                orphanFiles: [],
                recoverableBytes: 0,
              }),
        ]).then(([database, storage, backups, orphans]) => ({
          database,
          storage,
          lastBackup: backups[0] ?? null,
          orphanFileCount: orphans.orphanFiles.length,
          orphanRecordCount: orphans.orphanDbRecords.length,
        }))
      : Promise.resolve(null),
  ]);

  return (
    <DashboardView
      user={user}
      analytics={analytics}
      recentActivity={recentActivity}
      notifications={notifications}
      unreadCount={unreadCount}
      overdueEntries={slaData.overdueEntries}
      escalatedEntries={slaData.escalatedEntries}
      dueTodayEntries={slaData.dueTodayEntries}
      dueSoonEntries={slaData.dueSoonEntries}
      highPriorityEntries={highPriorityEntries}
      immediateEntries={immediateEntries}
      userStats={userStats}
      taskStats={taskStats}
      systemHealth={systemHealthBundle}
    />
  );
}
