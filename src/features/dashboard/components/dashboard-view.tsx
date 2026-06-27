import { Landmark, Sparkles, History, Bell, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { RecentActivityWidget } from "@/features/audit/components/recent-activity-widget";
import type { DakHistoryEntry } from "@/features/audit/services/dak-history";
import {
  NotificationWidget,
  OverdueAlertCards,
  DashboardAlerts,
} from "@/features/notifications/components/notification-widgets";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import type {
  OverdueDakRow,
  PriorityDakRow,
} from "@/features/notifications/services/notify-dak-event";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { CollectorStatCards } from "@/features/dashboard/components/collector-stat-cards";
import { DashboardChartsPanel } from "@/features/dashboard/components/dashboard-charts-panel";
import { DashboardInsightsPanel } from "@/features/dashboard/components/dashboard-insights-panel";
import { DepartmentStatCards } from "@/features/dashboard/components/department-stat-cards";
import { PendingDepartmentsTable } from "@/features/dashboard/components/pending-departments-table";
import { PendingSectionsTable } from "@/features/dashboard/components/pending-sections-table";
import { SectionPerformancePanel } from "@/features/dashboard/components/section-performance-panel";
import type { DashboardAnalytics } from "@/features/reports/services/dashboard-analytics";
import { isDepartmentDashboardRole } from "@/lib/auth/permissions";
import { appConfig } from "@/lib/constants/navigation";
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
}

export function DashboardView({
  user,
  analytics,
  recentActivity,
  notifications,
  unreadCount,
  overdueEntries,
  highPriorityEntries,
  immediateEntries,
}: DashboardViewProps) {
  const isDepartmentView =
    analytics.variant === "department" && isDepartmentDashboardRole(user.role);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary via-primary to-[oklch(0.32_0.1_255)] px-6 py-6 text-primary-foreground shadow-lg shadow-primary/15 md:px-8 md:py-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 16px, currentColor 16px, currentColor 17px)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 ring-1 ring-primary-foreground/20">
              <Landmark className="size-6" />
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.15em] text-primary-foreground/70 uppercase">
                {appConfig.districtAdministration}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                {isDepartmentView ? "Department Dashboard" : "Collector Dashboard"}
              </h1>
              <p className="mt-1.5 text-sm text-primary-foreground/80">
                Welcome back,{" "}
                <span className="font-medium text-primary-foreground">
                  {user.name}
                </span>
                .{" "}
                {isDepartmentView
                  ? `Monitoring ${analytics.departmentName} correspondence and actions.`
                  : "District DAK overview, analytics, and department performance."}
              </p>
            </div>
          </div>
          <Badge className="w-fit border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground capitalize hover:bg-primary-foreground/15">
            <Sparkles className="size-3" />
            {user.role.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {analytics.variant === "department" ? (
        <>
          <DepartmentStatCards data={analytics} />
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
          <DashboardChartsPanel
            priorityChart={analytics.priorityChart}
            statusChart={analytics.statusChart}
            recentDak={analytics.recentDak}
            recentTitle="Recent Department DAK"
            recentDescription="Latest items assigned to your department"
          />
          <DashboardSection
            title="Recent Activity"
            description="Latest workflow actions in your department"
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
        </>
      ) : (
        <>
          <CollectorStatCards stats={analytics.stats} />
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
        </>
      )}
    </div>
  );
}
