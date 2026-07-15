"use client";

import { CollectorAtrDashboardBanner } from "@/features/dak/components/collector-atr-dashboard-banner";
import { NewDakReceivedDashboardBanner } from "@/features/notifications/components/new-dak-received-dashboard-banner";
import type { UserRole } from "@/types";

interface DashboardAlertBannersProps {
  role: UserRole;
}

/**
 * Client-only alert strip for district dashboards.
 * Isolated from the server dashboard tree to avoid SSR chunk mismatches.
 */
export function DashboardAlertBanners({ role }: DashboardAlertBannersProps) {
  const showAtrBanner = role === "collector" || role === "adm";

  return (
    <div className="space-y-3">
      <NewDakReceivedDashboardBanner role={role} />
      {showAtrBanner ? <CollectorAtrDashboardBanner /> : null}
    </div>
  );
}
