"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useNotifications } from "@/features/notifications/components/notification-realtime-provider";
import type { UserRole } from "@/types";

const SESSION_KEY = "dak-new-dak-received-toast-shown";

interface NewDakReceivedToastProps {
  role: UserRole;
}

/**
 * Dashboard popup for Collector / ADM / ACP when unread new-DAK
 * notifications are waiting (registered by DAK Operator).
 */
export function NewDakReceivedToast({ role }: NewDakReceivedToastProps) {
  const { notifications } = useNotifications();
  const shown = useRef(false);

  useEffect(() => {
    if (role !== "collector" && role !== "adm" && role !== "acp") {
      return;
    }
    if (shown.current) return;

    const unreadNewDaks = notifications.filter(
      (n) => n.type === "dak_created" && !n.readAt
    );

    if (unreadNewDaks.length === 0) return;

    if (typeof window !== "undefined") {
      const alreadyShown = window.sessionStorage.getItem(SESSION_KEY);
      if (alreadyShown === "1") return;
      window.sessionStorage.setItem(SESSION_KEY, "1");
    }

    shown.current = true;
    const count = unreadNewDaks.length;
    const latest = unreadNewDaks[0];
    const assignHref =
      role === "acp" ? "/dashboard/dak/pending" : "/dashboard/dak/assignments";

    toast.warning(
      count === 1
        ? "New DAK received from DAK Operator"
        : `${count} new DAKs received from DAK Operator`,
      {
        description:
          count === 1
            ? latest?.body ?? "A new DAK is awaiting review / assignment."
            : `Latest: ${latest?.body ?? "Open Pending Assignment to review."}`,
        duration: 14000,
        action: {
          label: count === 1 && latest?.dakId ? "Open DAK" : "View queue",
          onClick: () => {
            window.location.href =
              count === 1 && latest?.dakId
                ? `/dashboard/dak/${latest.dakId}`
                : assignHref;
          },
        },
      }
    );
  }, [notifications, role]);

  return null;
}
