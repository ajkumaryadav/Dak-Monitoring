"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "@/features/reports/charts/chart-container";
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
} from "@/features/reports/charts/chart-colors";
import type { DepartmentPerformanceRow } from "@/features/reports/services/dashboard-analytics";

interface DepartmentPerformanceChartProps {
  data: DepartmentPerformanceRow[];
}

export function DepartmentPerformanceChart({
  data,
}: DepartmentPerformanceChartProps) {
  const chartData = data.slice(0, 8).map((row) => ({
    name:
      row.department_name.length > 14
        ? `${row.department_name.slice(0, 12)}…`
        : row.department_name,
    total: row.total,
    pending: row.pending,
    completed: row.completed,
    overdue: row.overdue,
  }));

  if (!chartData.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No department data available yet.
      </p>
    );
  }

  return (
    <ChartContainer height={288}>
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
          data={chartData}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Legend />
          <Bar
            dataKey="total"
            fill={CHART_COLORS.total}
            radius={[4, 4, 0, 0]}
            name="Total"
            minPointSize={3}
          />
          <Bar
            dataKey="pending"
            fill={CHART_COLORS.pending}
            radius={[4, 4, 0, 0]}
            name="Pending"
            minPointSize={3}
          />
          <Bar
            dataKey="overdue"
            fill={CHART_COLORS.overdue}
            radius={[4, 4, 0, 0]}
            name="Overdue"
            minPointSize={3}
          />
          <Bar
            dataKey="completed"
            fill={CHART_COLORS.completed}
            radius={[4, 4, 0, 0]}
            name="Completed"
            minPointSize={3}
          />
        </BarChart>
      )}
    </ChartContainer>
  );
}
