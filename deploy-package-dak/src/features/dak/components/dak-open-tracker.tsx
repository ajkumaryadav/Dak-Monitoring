"use client";

import { useEffect, useRef } from "react";

import { markDakOpenedAction } from "@/features/dak/actions/compliance-actions";

interface DakOpenTrackerProps {
  dakId: string;
  status: string;
}

/** Marks assigned DAK as in progress when the officer opens the detail page. */
export function DakOpenTracker({ dakId, status }: DakOpenTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || status !== "assigned") {
      return;
    }

    tracked.current = true;
    void markDakOpenedAction(dakId);
  }, [dakId, status]);

  return null;
}
