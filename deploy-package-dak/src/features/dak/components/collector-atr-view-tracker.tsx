"use client";

import { useEffect, useRef } from "react";

import { useCollectorAtr } from "@/features/dak/components/collector-atr-provider";

interface CollectorAtrViewTrackerProps {
  dakId: string;
  status: string;
}

/** Marks an ATR / Compliance DAK as opened by the Collector. */
export function CollectorAtrViewTracker({
  dakId,
  status,
}: CollectorAtrViewTrackerProps) {
  const collectorAtr = useCollectorAtr();
  const tracked = useRef(false);

  useEffect(() => {
    if (!collectorAtr || tracked.current) {
      return;
    }

    const normalized = status.replace(/-/g, "_");
    if (normalized !== "atr_submitted" && normalized !== "pending_approval") {
      return;
    }

    tracked.current = true;
    collectorAtr.markViewed(dakId);
  }, [collectorAtr, dakId, status]);

  return null;
}
