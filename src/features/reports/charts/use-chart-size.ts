"use client";

import { useEffect, useRef, useState } from "react";

interface ChartSize {
  width: number;
  height: number;
  ready: boolean;
}

/** Measure container width client-side — avoids Recharts ResponsiveContainer SSR bugs. */
export function useChartSize(height = 256): ChartSize & { ref: React.RefObject<HTMLDivElement | null> } {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height, ready: false });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let attempts = 0;

    const update = () => {
      const width = Math.floor(element.getBoundingClientRect().width);
      if (width > 0) {
        setSize({ width, height, ready: true });
        return;
      }

      if (attempts < 20) {
        attempts += 1;
        requestAnimationFrame(update);
      }
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [height]);

  return { ref, ...size };
}
