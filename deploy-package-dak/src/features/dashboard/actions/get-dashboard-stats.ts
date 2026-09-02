"use server";

import {
  fetchDashboardAnalytics,
  type DashboardAnalytics,
} from "@/features/reports/services/dashboard-analytics";
import { getSessionUser } from "@/lib/session";

/** Server action — role-aware dashboard statistics and chart data. */
export async function getDashboardStats(): Promise<DashboardAnalytics | null> {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return fetchDashboardAnalytics(user);
}
