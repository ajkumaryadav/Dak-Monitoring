import { cn } from "@/lib/utils";

import { CHART_COLORS, CHART_PALETTE } from "@/features/reports/charts/chart-colors";
import type { ChartCountRow } from "@/features/reports/services/dashboard-analytics";

interface SimpleBarChartProps {
  data: ChartCountRow[];
  barClassName?: string;
  emptyMessage?: string;
}

export function SimpleBarChart({
  data,
  barClassName = "bg-primary",
  emptyMessage = "No data available.",
}: SimpleBarChartProps) {
  const rows = data.filter((d) => d.value > 0);

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">{row.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", barClassName)}
              style={{ width: `${Math.max((row.value / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  Routine: CHART_COLORS.routine,
  Important: CHART_COLORS.important,
  Urgent: CHART_COLORS.urgent,
  Immediate: CHART_COLORS.immediate,
};

interface SimplePriorityChartProps {
  data: ChartCountRow[];
}

export function SimplePriorityChart({ data }: SimplePriorityChartProps) {
  const rows = data.filter((d) => d.value > 0);

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No active DAK by priority.
      </p>
    );
  }

  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full">
        {rows.map((row, index) => (
          <div
            key={row.label}
            title={`${row.label}: ${row.value}`}
            style={{
              width: `${(row.value / total) * 100}%`,
              backgroundColor:
                PRIORITY_COLORS[row.label] ??
                CHART_PALETTE[index % CHART_PALETTE.length],
            }}
          />
        ))}
      </div>
      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.label} className="flex items-center gap-3">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  PRIORITY_COLORS[row.label] ??
                  CHART_PALETTE[index % CHART_PALETTE.length],
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex justify-between text-sm">
                <span>{row.label}</span>
                <span className="tabular-nums font-medium">{row.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max((row.value / max) * 100, 4)}%`,
                    backgroundColor:
                      PRIORITY_COLORS[row.label] ??
                      CHART_PALETTE[index % CHART_PALETTE.length],
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SimpleStatusChartProps {
  data: ChartCountRow[];
}

export function SimpleStatusChart({ data }: SimpleStatusChartProps) {
  return (
    <SimpleBarChart
      data={data}
      barClassName="bg-[#1e40af]"
      emptyMessage="No status data available."
    />
  );
}
