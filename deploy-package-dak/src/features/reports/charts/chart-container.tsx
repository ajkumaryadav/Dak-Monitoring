"use client";

import { cn } from "@/lib/utils";
import { useChartSize } from "@/features/reports/charts/use-chart-size";

interface ChartContainerProps {
  height?: number;
  className?: string;
  children: (size: { width: number; height: number }) => React.ReactNode;
}

export function ChartContainer({
  height = 256,
  className,
  children,
}: ChartContainerProps) {
  const { ref, width, height: chartHeight, ready } = useChartSize(height);

  return (
    <div
      ref={ref}
      className={cn("w-full min-w-0", className)}
      style={{ height: chartHeight, minHeight: chartHeight }}
    >
      {ready ? (
        children({ width, height: chartHeight })
      ) : (
        <div
          className="h-full w-full animate-pulse rounded-lg bg-muted/40"
          aria-hidden
        />
      )}
    </div>
  );
}
