import { AlertTriangle, Bell, History, ListTodo, Sparkles } from "lucide-react";

import { RecentActivityWidget } from "@/features/audit/components/recent-activity-widget";
import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { CollectorStatCards } from "@/features/dashboard/components/collector-stat-cards";
import { DashboardChartsPanel } from "@/features/dashboard/components/dashboard-charts-panel";
import { DashboardHero } from "@/features/dashboard/components/dashboard-hero";
import { DashboardInsightsPanel } from "@/features/dashboard/components/dashboard-insights-panel";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { PendingDepartmentsTable } from "@/features/dashboard/components/pending-departments-table";
import { PendingSectionsTable } from "@/features/dashboard/components/pending-sections-table";
import { SectionPerformancePanel } from "@/features/dashboard/components/section-performance-panel";
import {
  DashboardAlerts,
  NotificationWidget,
  OverdueAlertCards,
} from "@/features/notifications/components/notification-widgets";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import type { PriorityDakRow } from "@/features/notifications/services/notify-dak-event";
import type { SlaDakRow } from "@/features/sla/lib/sla-types";
import { SlaDashboardWidgets } from "@/features/sla/components/sla-dashboard-widgets";
import type { CollectorDashboardData } from "@/features/reports/services/dashboard-analytics";
import { UserStatsCards } from "@/features/users/components/user-stats-cards";
import { CollectorTaskStatCards } from "@/features/dashboard/components/task-stat-cards";
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
  highPriorityEntries: PriorityDakRow[];
  immediateEntries: PriorityDakRow[];
  userStats?: UserStatsSummary | null;
  taskStats?: TaskStatsSummary | null;
}

/** Full district dashboard for Collector, ACP, and ADM. */
export function CollectorDashboard({
  user,
  analytics,
  recentActivity,
  notifications,
  unreadCount,
  overdueEntries,
  escalatedEntries,
  dueTodayEntries,
  highPriorityEntries,
  immediateEntries,
  userStats,
  taskStats,
}: CollectorDashboardProps) {
  return (
    <div className="space-y-8">
      <DashboardHero
        user={user}
        title="Collector Dashboard"
        description="District DAK overview, analytics, and department performance."
      />

      <CollectorStatCards stats={analytics.stats} />

      {taskStats ? (
        <DashboardSection
          title="Task Management"
          description="Administrative task assignments and compliance tracking"
          icon={ListTodo}
          variant="neutral"
        >
          <CollectorTaskStatCards stats={taskStats} />
        </DashboardSection>
      ) : null}

      {userStats ? (
        <DashboardSection
          title="User Management"
          description="District user accounts overview"
          icon={Sparkles}
          variant="neutral"
        >
          <UserStatsCards stats={userStats} />
        </DashboardSection>
      ) : null}

      <DashboardSection
        title="SLA Monitoring"
        description="Overdue, escalated, and due-today DAK requiring district action"
        icon={AlertTriangle}
        variant="primary"
      >
        <SlaDashboardWidgets
          variant="collector"
          overdueEntries={overdueEntries}
          escalatedEntries={escalatedEntries}
          dueTodayEntries={dueTodayEntries}
        />
      </DashboardSection>

      <DashboardSection
        title="Alerts"
        description="Overdue, priority, immediate, and unread notifications"
        icon={AlertTriangle}
        variant="primary"
      >
        <DashboardAlerts
          overdueCount={analytics.stats.overdue}
          highPriorityCount={highPriorityEntries.length}
          immediateCount={immediateEntries.length}
          unreadCount={unreadCount}
          topHighPriority={highPriorityEntries}
          topImmediate={immediateEntries}
        />
      </DashboardSection>

      <DashboardSection
        title="Overdue Alerts"
        description="District DAK requiring immediate attention"
        icon={AlertTriangle}
        variant="primary"
      >
        <OverdueAlertCards
          overdueCount={analytics.stats.overdue}
          topOverdue={overdueEntries}
        />
      </DashboardSection>

      <DashboardChartsPanel
        priorityChart={analytics.priorityChart}
        statusChart={analytics.statusChart}
        sourceChart={analytics.sourceChart}
        recentDak={analytics.recentDak}
        departmentPerformance={analytics.departmentPerformance}
      />

      <DashboardSection
        title="Notifications"
        description="Recent assignments, status changes, and overdue alerts"
        icon={Bell}
        variant="neutral"
      >
        <NotificationWidget
          notifications={notifications}
          unreadCount={unreadCount}
        />
      </DashboardSection>

      <DashboardSection
        title="Recent Activity"
        description="Latest DAK registrations, assignments, and status changes"
        icon={History}
        variant="neutral"
      >
        <RecentActivityWidget entries={recentActivity} />
      </DashboardSection>

      <PendingDepartmentsTable rows={analytics.pendingDepartments} />
      <DashboardInsightsPanel
        stats={analytics.stats}
        sourceChart={analytics.sourceChart}
      />
      <SectionPerformancePanel rows={analytics.sectionPerformance} />
      <PendingSectionsTable rows={analytics.pendingSections} />
    </div>
  );
}
