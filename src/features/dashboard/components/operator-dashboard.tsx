import { Bell, FileText } from "lucide-react";

import { DashboardHero } from "@/features/dashboard/components/dashboard-hero";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { OperatorStatCards } from "@/features/dashboard/components/operator-stat-cards";
import { NotificationWidget } from "@/features/notifications/components/notification-widgets";
import type { NotificationRecord } from "@/features/notifications/services/notifications";
import { RecentDakTable } from "@/features/reports/components/recent-dak-table";
import type { OperatorDashboardData } from "@/features/reports/services/dashboard-analytics";
import type { SessionUser } from "@/types";

interface OperatorDashboardProps {
  user: SessionUser;
  analytics: OperatorDashboardData;
  notifications: NotificationRecord[];
  unreadCount: number;
}

/** DAK operator dashboard — own registrations only, no district analytics. */
export function OperatorDashboard({
  user,
  analytics,
  notifications,
  unreadCount,
}: OperatorDashboardProps) {
  return (
    <div className="space-y-8">
      <DashboardHero
        user={user}
        title="Operator Dashboard"
        description="Your registration workload — diary entries you have captured and forwarded."
      />

      <OperatorStatCards stats={analytics.stats} />

      <DashboardSection
        title="Recent Entries"
        description="Latest DAK you have registered"
        icon={FileText}
        variant="neutral"
      >
        <RecentDakTable rows={analytics.recentDak} pageSize={8} />
      </DashboardSection>

      <DashboardSection
        title="Notifications"
        description="Your workflow alerts"
        icon={Bell}
        variant="neutral"
      >
        <NotificationWidget
          notifications={notifications}
          unreadCount={unreadCount}
        />
      </DashboardSection>
    </div>
  );
}
