import type { ChartCountRow } from "@/features/reports/services/dashboard-analytics";

/** Static demo metrics for the login page — never loads production data. */
export const LOGIN_SHOWCASE_STATS = {
  totalDak: 1248,
  pendingDak: 186,
  completedDak: 982,
  overdueDak: 42,
  disposedRate: 78,
} as const;

export const LOGIN_SHOWCASE_STATUS_CHART: ChartCountRow[] = [
  { label: "Received", value: 45 },
  { label: "Assigned", value: 62 },
  { label: "Under Process", value: 88 },
  { label: "Pending", value: 54 },
  { label: "Disposed", value: 120 },
  { label: "Closed", value: 98 },
];

export const LOGIN_SHOWCASE_MONTHLY_TREND: ChartCountRow[] = [
  { label: "Jan", value: 89 },
  { label: "Feb", value: 102 },
  { label: "Mar", value: 118 },
  { label: "Apr", value: 95 },
  { label: "May", value: 134 },
  { label: "Jun", value: 121 },
];

export const LOGIN_SHOWCASE_DEPARTMENT_RATES: ChartCountRow[] = [
  { label: "Revenue", value: 92 },
  { label: "Education", value: 85 },
  { label: "Health", value: 78 },
  { label: "Panchayat", value: 88 },
  { label: "Police", value: 94 },
];

export function getLoginShowcaseStats() {
  return {
    stats: LOGIN_SHOWCASE_STATS,
    statusChart: LOGIN_SHOWCASE_STATUS_CHART,
    monthlyTrend: LOGIN_SHOWCASE_MONTHLY_TREND,
    departmentRates: LOGIN_SHOWCASE_DEPARTMENT_RATES,
  };
}
