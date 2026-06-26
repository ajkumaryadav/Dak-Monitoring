import { getSessionUser } from "@/lib/session";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return <DashboardView user={user} />;
}
