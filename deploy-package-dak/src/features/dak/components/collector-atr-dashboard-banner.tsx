"use client";

import Link from "next/link";

import { useCollectorAtr } from "@/features/dak/components/collector-atr-provider";

/** Dashboard alert banner for unread ATR / Compliance returns. */
export function CollectorAtrDashboardBanner() {
  const collectorAtr = useCollectorAtr();

  if (!collectorAtr || collectorAtr.unreadCount <= 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/[0.08] via-primary/[0.05] to-transparent px-4 py-3 text-sm shadow-sm">
      <p className="font-semibold text-foreground">
        {collectorAtr.unreadCount} DAK
        {collectorAtr.unreadCount === 1 ? "" : "s"} returned with ATR/Compliance
        for your review.
      </p>
      <Link
        href="/dashboard/dak/atr-compliance"
        className="mt-1 inline-block text-sm font-semibold text-primary hover:underline"
      >
        Open ATR / Compliance Received →
      </Link>
    </div>
  );
}
