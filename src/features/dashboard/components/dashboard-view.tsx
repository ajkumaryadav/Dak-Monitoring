import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { CollectorDashboard } from "@/features/dashboard/components/collector-dashboard";
import { DepartmentDashboard } from "@/features/dashboard/components/department-dashboard";
import { OperatorDashboard } from "@/features/dashboard/components/operator-dashboard";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import type {
  OverdueDakRow,
  PriorityDakRow,
} from "@/features/notifications/services/notify-dak-event";
import type { DashboardAnalytics } from "@/features/reports/services/dashboard-analytics";
import type { UserStatsSummary } from "@/features/users/services/get-users";
import type { SessionUser } from "@/types";

interface DashboardViewProps {
  user: SessionUser;
  analytics: DashboardAnalytics;
  recentActivity: DakHistoryEntry[];
  notifications: NotificationRecord[];
  unreadCount: number;
  overdueEntries: OverdueDakRow[];
  highPriorityEntries: PriorityDakRow[];
  immediateEntries: PriorityDakRow[];
  userStats?: UserStatsSummary | null;
}

/** Route to the correct role-scoped dashboard view. */
export function DashboardView({
  user,
  analytics,
  recentActivity,
  notifications,
  unreadCount,
  overdueEntries,
  highPriorityEntries,
  immediateEntries,
  userStats,
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
        highPriorityEntries={highPriorityEntries}
        immediateEntries={immediateEntries}
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
      highPriorityEntries={highPriorityEntries}
      immediateEntries={immediateEntries}
      userStats={userStats}
    />
  );
}
