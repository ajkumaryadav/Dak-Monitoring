import { AlertTriangle, Bell, History, ListTodo } from "lucide-react";

import { RecentActivityWidget } from "@/features/audit/components/recent-activity-widget";
import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import { DashboardAlertBanners } from "@/features/dashboard/components/dashboard-alert-banners";
import { DashboardHero } from "@/features/dashboard/components/dashboard-hero";
import { DashboardChartsPanel } from "@/features/dashboard/components/dashboard-charts-panel";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DepartmentStatCards } from "@/features/dashboard/components/department-stat-cards";
import { SectionStatCards } from "@/features/dashboard/components/section-stat-cards";
import {
  DashboardAlerts,
  NotificationWidget,
  OverdueAlertCards,
} from "@/features/notifications/components/notification-widgets";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import type { PriorityDakRow } from "@/features/notifications/services/notify-dak-event";
import type { SlaDakRow } from "@/features/sla/lib/sla-types";
import { SlaDashboardWidgets } from "@/features/sla/components/sla-dashboard-widgets";
import type {
  DepartmentDashboardData,
  SectionDashboardData,
} from "@/features/reports/services/dashboard-analytics";
import { DepartmentTaskStatCards } from "@/features/dashboard/components/task-stat-cards";
import type { TaskStatsSummary } from "@/features/tasks/services/tasks";
import type { SessionUser } from "@/types";

interface DepartmentDashboardProps {
  user: SessionUser;
  analytics: DepartmentDashboardData | SectionDashboardData;
  recentActivity: DakHistoryEntry[];
  notifications: NotificationRecord[];
  unreadCount: number;
  overdueEntries: SlaDakRow[];
  dueSoonEntries: SlaDakRow[];
  highPriorityEntries: PriorityDakRow[];
  immediateEntries: PriorityDakRow[];
  taskStats?: TaskStatsSummary | null;
}

/** Department or section scoped dashboard — no district-wide analytics. */
export function DepartmentDashboard({
  user,
  analytics,
  recentActivity,
  notifications,
  unreadCount,
  overdueEntries,
  dueSoonEntries,
  highPriorityEntries,
  immediateEntries,
  taskStats,
}: DepartmentDashboardProps) {
  const isSection = analytics.variant === "section";

  return (
    <div className="space-y-8">
      <DashboardHero
        user={user}
        title={isSection ? "Section Dashboard" : "Department Dashboard"}
        description={
          isSection
            ? `Monitoring ${analytics.sectionName} correspondence and actions.`
            : `Monitoring ${analytics.departmentName} correspondence and actions.`
        }
      />

      <DashboardAlertBanners role={user.role} />

      {isSection ? (
        <SectionStatCards data={analytics} />
      ) : (
        <DepartmentStatCards data={analytics} />
      )}

      {taskStats ? (
        <DashboardSection
          title="Task Management"
          description="Department task assignments and compliance status"
          icon={ListTodo}
          variant="neutral"
        >
          <DepartmentTaskStatCards stats={taskStats} />
        </DashboardSection>
      ) : null}

      {analytics.variant === "department" && (
        <>
          <DashboardSection
            title="SLA Monitoring"
            description="Department overdue and due-soon DAK"
            icon={AlertTriangle}
            variant="primary"
          >
            <SlaDashboardWidgets
              variant="department"
              overdueEntries={overdueEntries}
              escalatedEntries={[]}
              dueTodayEntries={[]}
              dueSoonEntries={dueSoonEntries}
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
            description="Department DAK past due date"
            icon={AlertTriangle}
            variant="primary"
          >
            <OverdueAlertCards
              overdueCount={analytics.stats.overdue}
              topOverdue={overdueEntries}
            />
          </DashboardSection>
        </>
      )}

      <DashboardChartsPanel
        priorityChart={analytics.priorityChart}
        statusChart={analytics.statusChart}
        recentDak={analytics.recentDak}
        recentTitle={isSection ? "Recent Section DAK" : "Recent Department DAK"}
        recentDescription={
          isSection
            ? "Latest items assigned to your section"
            : "Latest items assigned to your department"
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Recent Activity"
          description={
            isSection
              ? "Latest workflow actions in your section"
              : "Latest workflow actions in your department"
          }
          icon={History}
          variant="neutral"
        >
          <RecentActivityWidget entries={recentActivity} />
        </DashboardSection>

        <DashboardSection
          title="Notifications"
          description="Recent alerts and workflow updates"
          icon={Bell}
          variant="neutral"
        >
          <NotificationWidget
            notifications={notifications}
            unreadCount={unreadCount}
          />
        </DashboardSection>
      </div>
    </div>
  );
}
