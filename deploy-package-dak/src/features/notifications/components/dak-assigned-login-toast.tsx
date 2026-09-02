"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useNotifications } from "@/features/notifications/components/notification-realtime-provider";
import type { UserRole } from "@/types";

const SESSION_KEY = "dak-assigned-login-toast-shown";

interface DakAssignedLoginToastProps {
  role: UserRole;
}

/**
 * One-shot login popup for department / internal section users when
 * unread DAK assignment or reassignment notifications are waiting.
 */
export function DakAssignedLoginToast({ role }: DakAssignedLoginToastProps) {
  const { notifications } = useNotifications();
  const shown = useRef(false);

  useEffect(() => {
    if (role !== "department_user" && role !== "section_user") {
      return;
    }
    if (shown.current) return;

    const unreadAssigned = notifications.filter(
      (n) =>
        (n.type === "dak_assigned" || n.type === "dak_reassigned") && !n.readAt
    );

    if (unreadAssigned.length === 0) return;

    if (typeof window !== "undefined") {
      const alreadyShown = window.sessionStorage.getItem(SESSION_KEY);
      if (alreadyShown === "1") return;
      window.sessionStorage.setItem(SESSION_KEY, "1");
    }

    shown.current = true;
    const count = unreadAssigned.length;
    const latest = unreadAssigned[0];
    const hasReassign = unreadAssigned.some((n) => n.type === "dak_reassigned");
    const queueHref = "/dashboard/dak/assigned";

    const headline =
      count === 1
        ? hasReassign
          ? "DAK reassigned to you"
          : "New DAK assigned to you"
        : hasReassign
          ? `${count} DAKs assigned / reassigned — action pending`
          : `${count} new DAKs assigned — action pending`;

    toast.warning(headline, {
      description:
        count === 1
          ? (latest?.body ?? "Open your assigned queue to begin processing.")
          : `Latest: ${latest?.body ?? "Open Assigned DAK to review pending files."}`,
      duration: 14000,
      action: {
        label: count === 1 && latest?.dakId ? "Open DAK" : "View assigned",
        onClick: () => {
          window.location.href =
            count === 1 && latest?.dakId
              ? `/dashboard/dak/${latest.dakId}`
              : queueHref;
        },
      },
    });
  }, [notifications, role]);

  return null;
}
