import { getDashboardStats } from "@/features/dak/services/get-dak-stats";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const stats = await getDashboardStats(user);

  return <DashboardView user={user} stats={stats} />;
}
