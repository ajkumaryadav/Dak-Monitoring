/** Hex colors for Recharts SVG fills — CSS variables are unreliable in SVG attributes. */
export const CHART_COLORS = {
  primary: "#1e40af",
  pending: "#1e40af",
  overdue: "#f59e0b",
  completed: "#10b981",
  total: "#94a3b8",
  important: "#3b82f6",
  urgent: "#f59e0b",
  immediate: "#ef4444",
  routine: "#64748b",
} as const;

export const CHART_PALETTE = [
  CHART_COLORS.pending,
  CHART_COLORS.important,
  CHART_COLORS.urgent,
  CHART_COLORS.immediate,
  CHART_COLORS.completed,
  "#8b5cf6",
] as const;

export const CHART_TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#0f172a",
} as const;
