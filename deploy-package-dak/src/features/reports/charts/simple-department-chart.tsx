import { CHART_COLORS } from "@/features/reports/charts/chart-colors";
import type { DepartmentPerformanceRow } from "@/features/reports/services/dashboard-analytics";

interface SimpleDepartmentChartProps {
  data: DepartmentPerformanceRow[];
}

export function SimpleDepartmentChart({ data }: SimpleDepartmentChartProps) {
  const rows = data.slice(0, 8);

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No department data available yet.
      </p>
    );
  }

  const max = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: CHART_COLORS.total }}
          />
          Total
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: CHART_COLORS.pending }}
          />
          Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: CHART_COLORS.overdue }}
          />
          Overdue
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: CHART_COLORS.completed }}
          />
          Completed
        </span>
      </div>

      <ul className="space-y-4">
        {rows.map((row) => (
          <li key={row.department_id}>
            <div className="mb-2 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">{row.department_name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.total} total
              </span>
            </div>
            <div className="space-y-1.5">
              {(
                [
                  ["total", row.total, CHART_COLORS.total],
                  ["pending", row.pending, CHART_COLORS.pending],
                  ["overdue", row.overdue, CHART_COLORS.overdue],
                  ["completed", row.completed, CHART_COLORS.completed],
                ] as const
              ).map(([key, value, color]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs capitalize text-muted-foreground">
                    {key}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs tabular-nums">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
