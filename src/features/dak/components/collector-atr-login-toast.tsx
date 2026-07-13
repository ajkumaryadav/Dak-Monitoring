"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useCollectorAtr } from "@/features/dak/components/collector-atr-provider";

const SESSION_KEY = "dak-collector-atr-toast-shown";

/** One-time popup after login when ATR / Compliance DAKs await review. */
export function CollectorAtrLoginToast() {
  const collectorAtr = useCollectorAtr();
  const shown = useRef(false);

  useEffect(() => {
    if (!collectorAtr || shown.current || collectorAtr.unreadCount <= 0) {
      return;
    }

    if (typeof window !== "undefined") {
      const alreadyShown = window.sessionStorage.getItem(SESSION_KEY);
      if (alreadyShown === "1") {
        return;
      }
      window.sessionStorage.setItem(SESSION_KEY, "1");
    }

    shown.current = true;
    const count = collectorAtr.unreadCount;

    toast.info(
      `${count} DAK${count === 1 ? "" : "s"} have been returned with ATR/Compliance for your review.`,
      {
        description: "Review submissions in the ATR / Compliance Received queue.",
        duration: 10000,
        action: {
          label: "View queue",
          onClick: () => {
            window.location.href = "/dashboard/dak/atr-compliance";
          },
        },
      }
    );
  }, [collectorAtr]);

  return null;
}
