"use client";

import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";

import { ChartContainer } from "@/features/reports/charts/chart-container";
import {
  CHART_PALETTE,
  CHART_TOOLTIP_STYLE,
} from "@/features/reports/charts/chart-colors";
import type { ChartCountRow } from "@/features/reports/services/dashboard-analytics";

interface PriorityDistributionChartProps {
  data: ChartCountRow[];
}

export function PriorityDistributionChart({
  data,
}: PriorityDistributionChartProps) {
  const filtered = data.filter((d) => d.value > 0);

  if (!filtered.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No active DAK by priority.
      </p>
    );
  }

  return (
    <ChartContainer height={280}>
      {({ width, height }) => (
        <PieChart width={width} height={height}>
          <Pie
            data={filtered}
            dataKey="value"
            nameKey="label"
            cx={width / 2}
            cy={height / 2 - 16}
            innerRadius={52}
            outerRadius={82}
            paddingAngle={3}
          >
            {filtered.map((_, index) => (
              <Cell
                key={index}
                fill={CHART_PALETTE[index % CHART_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [value, "Count"]}
            contentStyle={CHART_TOOLTIP_STYLE}
          />
          <Legend verticalAlign="bottom" />
        </PieChart>
      )}
    </ChartContainer>
  );
}
