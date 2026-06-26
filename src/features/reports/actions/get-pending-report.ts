"use server";

import {
  fetchPendingReport,
  type PendingReportFilters,
  type PendingReportRow,
} from "@/features/reports/services/pending-report";
import { getSessionUser } from "@/lib/session";

/** Server action — fetch pending/overdue DAK rows with report filters. */
export async function getPendingReport(
  filters: PendingReportFilters = {}
): Promise<PendingReportRow[]> {
  const user = await getSessionUser();

  if (!user) {
    return [];
  }

  return fetchPendingReport(user, filters);
}
