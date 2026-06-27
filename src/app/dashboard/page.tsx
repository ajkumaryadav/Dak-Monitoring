import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getRecentActivity } from "@/features/audit/services/dak-history";
import { fetchDashboardAnalytics } from "@/features/reports/services/dashboard-analytics";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const [analytics, recentActivity] = await Promise.all([
    fetchDashboardAnalytics(user),
    getRecentActivity(user, 8),
  ]);

  return (
    <DashboardView
      user={user}
      analytics={analytics}
      recentActivity={recentActivity}
    />
  );
}
