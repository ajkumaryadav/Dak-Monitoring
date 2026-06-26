import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { fetchDashboardAnalytics } from "@/features/reports/services/dashboard-analytics";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const analytics = await fetchDashboardAnalytics(user);

  return <DashboardView user={user} analytics={analytics} />;
}
