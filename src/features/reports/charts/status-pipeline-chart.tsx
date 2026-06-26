"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "@/features/reports/charts/chart-container";
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
} from "@/features/reports/charts/chart-colors";
import type { ChartCountRow } from "@/features/reports/services/dashboard-analytics";

interface StatusPipelineChartProps {
  data: ChartCountRow[];
}

export function StatusPipelineChart({ data }: StatusPipelineChartProps) {
  const chartData = data.filter((d) => d.value > 0);

  if (!chartData.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No status data available.
      </p>
    );
  }

  return (
    <ChartContainer height={256}>
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            horizontal={false}
          />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="label"
            width={96}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          <Bar
            dataKey="value"
            fill={CHART_COLORS.pending}
            radius={[0, 4, 4, 0]}
            name="Count"
            minPointSize={4}
          />
        </BarChart>
      )}
    </ChartContainer>
  );
}
