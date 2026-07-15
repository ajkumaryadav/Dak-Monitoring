import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { CollectorDashboard } from "@/features/dashboard/components/collector-dashboard";
import { DepartmentDashboard } from "@/features/dashboard/components/department-dashboard";
import { OperatorDashboard } from "@/features/dashboard/components/operator-dashboard";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import type { PriorityDakRow } from "@/features/notifications/services/notify-dak-event";
import type { SlaDakRow } from "@/features/sla/lib/sla-types";
import type { DashboardAnalytics } from "@/features/reports/services/dashboard-analytics";
import type { BackupRecord } from "@/features/system-admin/services/backup";
import type {
  DatabaseStats,
  StorageStats,
} from "@/features/system-admin/services/stats";
import type { TaskStatsSummary } from "@/features/tasks/services/tasks";
import type { UserStatsSummary } from "@/features/users/services/get-users";
import type { SessionUser } from "@/types";

interface DashboardViewProps {
  user: SessionUser;
  analytics: DashboardAnalytics;
  recentActivity: DakHistoryEntry[];
  notifications: NotificationRecord[];
  unreadCount: number;
  overdueEntries: SlaDakRow[];
  escalatedEntries: SlaDakRow[];
  dueTodayEntries: SlaDakRow[];
  dueSoonEntries: SlaDakRow[];
  highPriorityEntries: PriorityDakRow[];
  immediateEntries: PriorityDakRow[];
  userStats?: UserStatsSummary | null;
  taskStats?: TaskStatsSummary | null;
  systemHealth?: {
    database: DatabaseStats;
    storage: StorageStats;
    lastBackup: BackupRecord | null;
    orphanFileCount: number;
    orphanRecordCount: number;
  } | null;
}

/** Route to the correct role-scoped dashboard view. */
export function DashboardView({
  user,
  analytics,
  recentActivity,
  notifications,
  unreadCount,
  overdueEntries,
  escalatedEntries,
  dueTodayEntries,
  dueSoonEntries,
  highPriorityEntries,
  immediateEntries,
  userStats,
  taskStats,
  systemHealth,
}: DashboardViewProps) {
  if (analytics.variant === "operator") {
    return (
      <OperatorDashboard
        user={user}
        analytics={analytics}
        notifications={notifications}
        unreadCount={unreadCount}
      />
    );
  }

  if (analytics.variant === "department" || analytics.variant === "section") {
    return (
      <DepartmentDashboard
        user={user}
        analytics={analytics}
        recentActivity={recentActivity}
        notifications={notifications}
        unreadCount={unreadCount}
        overdueEntries={overdueEntries}
        dueSoonEntries={dueSoonEntries}
        highPriorityEntries={highPriorityEntries}
        immediateEntries={immediateEntries}
        taskStats={taskStats}
      />
    );
  }

  return (
    <CollectorDashboard
      user={user}
      analytics={analytics}
      recentActivity={recentActivity}
      notifications={notifications}
      unreadCount={unreadCount}
      overdueEntries={overdueEntries}
      escalatedEntries={escalatedEntries}
      dueTodayEntries={dueTodayEntries}
      userStats={userStats}
      taskStats={taskStats}
      systemHealth={systemHealth}
    />
  );
}
