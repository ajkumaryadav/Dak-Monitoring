import { AlertTriangle, Bell, History, ListTodo, Sparkles } from "lucide-react";

import { RecentActivityWidget } from "@/features/audit/components/recent-activity-widget";
import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { CollectorSegmentedDashboard } from "@/features/dashboard/components/collector-segmented-dashboard";
import { DashboardHero } from "@/features/dashboard/components/dashboard-hero";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { NotificationWidget } from "@/features/notifications/components/notification-widgets";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import { SlaDashboardWidgets } from "@/features/sla/components/sla-dashboard-widgets";
import type { CollectorDashboardData } from "@/features/reports/services/dashboard-analytics";
import { UserStatsCards } from "@/features/users/components/user-stats-cards";
import { CollectorTaskStatCards } from "@/features/dashboard/components/task-stat-cards";
import type { SlaDakRow } from "@/features/sla/lib/sla-types";
import type { TaskStatsSummary } from "@/features/tasks/services/tasks";
import type { UserStatsSummary } from "@/features/users/services/get-users";
import type { SessionUser } from "@/types";

interface CollectorDashboardProps {
  user: SessionUser;
  analytics: CollectorDashboardData;
  recentActivity: DakHistoryEntry[];
  notifications: NotificationRecord[];
  unreadCount: number;
  overdueEntries: SlaDakRow[];
  escalatedEntries: SlaDakRow[];
  dueTodayEntries: SlaDakRow[];
  userStats?: UserStatsSummary | null;
  taskStats?: TaskStatsSummary | null;
}

/** Segmented district dashboard for Collector, ACP, and ADM. */
export function CollectorDashboard({
  user,
  analytics,
  recentActivity,
  notifications,
  unreadCount,
  overdueEntries,
  escalatedEntries,
  dueTodayEntries,
  userStats,
  taskStats,
}: CollectorDashboardProps) {
  const dashboardTitle =
    user.role === "acp"
      ? "ACP Dashboard"
      : user.role === "adm"
        ? "ADM Dashboard"
        : "Collector Dashboard";

  return (
    <div className="space-y-6">
      <DashboardHero
        user={user}
        title={dashboardTitle}
        description="District DAK overview with category-wise analytics and performance monitoring."
      />

      <CollectorSegmentedDashboard analytics={analytics} />

      {taskStats ? (
        <DashboardSection
          title="Task Management"
          description="Administrative task assignments and compliance tracking"
          icon={ListTodo}
          variant="teal"
        >
          <CollectorTaskStatCards stats={taskStats} />
        </DashboardSection>
      ) : null}

      {userStats ? (
        <DashboardSection
          title="User Management"
          description="District user accounts overview"
          icon={Sparkles}
          variant="purple"
        >
          <UserStatsCards stats={userStats} />
        </DashboardSection>
      ) : null}

      <DashboardSection
        title="SLA Monitoring"
        description="Overdue, escalated, and due-today DAK requiring district action"
        icon={AlertTriangle}
        variant="red"
      >
        <SlaDashboardWidgets
          variant="collector"
          overdueEntries={overdueEntries}
          escalatedEntries={escalatedEntries}
          dueTodayEntries={dueTodayEntries}
        />
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Recent Notifications"
          description="Latest 3 alerts and assignments"
          icon={Bell}
          variant="neutral"
        >
          <NotificationWidget
            notifications={notifications}
            unreadCount={unreadCount}
            limit={3}
          />
        </DashboardSection>

        <DashboardSection
          title="Recent Activity"
          description="Latest 3 DAK workflow events"
          icon={History}
          variant="neutral"
        >
          <RecentActivityWidget entries={recentActivity.slice(0, 3)} />
        </DashboardSection>
      </div>
    </div>
  );
}
