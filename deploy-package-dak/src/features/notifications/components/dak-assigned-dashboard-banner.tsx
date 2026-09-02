"use client";

import Link from "next/link";
import { ClipboardList, X } from "lucide-react";
import { useState } from "react";

import { useNotifications } from "@/features/notifications/components/notification-realtime-provider";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface DakAssignedDashboardBannerProps {
  role: UserRole;
}

/**
 * Persistent dashboard flash banner for department / section users
 * when unread assignment or reassignment notifications exist.
 */
export function DakAssignedDashboardBanner({
  role,
}: DakAssignedDashboardBannerProps) {
  const { notifications } = useNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (role !== "department_user" && role !== "section_user") {
    return null;
  }

  const unreadAssigned = notifications.filter(
    (n) =>
      (n.type === "dak_assigned" || n.type === "dak_reassigned") && !n.readAt
  );

  if (dismissed || unreadAssigned.length === 0) {
    return null;
  }

  const count = unreadAssigned.length;
  const latest = unreadAssigned[0];
  const hasReassign = unreadAssigned.some((n) => n.type === "dak_reassigned");
  const queueHref = "/dashboard/dak/assigned";
  const openHref =
    count === 1 && latest?.dakId
      ? `/dashboard/dak/${latest.dakId}`
      : queueHref;

  const headline =
    count === 1
      ? hasReassign
        ? "DAK reassigned to your unit — action pending"
        : "New DAK assigned to your unit — action pending"
      : hasReassign
        ? `${count} DAKs assigned / reassigned — action pending`
        : `${count} new DAKs assigned — action pending`;

  return (
    <div
      role="alert"
      className={cn(
        "relative overflow-hidden rounded-xl border border-sky-500/40",
        "bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent",
        "px-4 py-3.5 text-sm shadow-sm animate-in fade-in-0 slide-in-from-top-2 duration-300"
      )}
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="absolute top-2.5 right-2.5 rounded-md p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>

      <div className="flex gap-3 pr-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-800 dark:text-sky-300">
          <ClipboardList className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sky-950 dark:text-sky-100">{headline}</p>
          <p className="mt-0.5 text-xs text-sky-950/80 dark:text-sky-100/80">
            {latest?.body ??
              "A file is waiting in your assigned queue for processing."}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href={openHref}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {count === 1 ? "Open DAK →" : "Open Assigned Queue →"}
            </Link>
            {count > 1 && latest?.dakId ? (
              <Link
                href={`/dashboard/dak/${latest.dakId}`}
                className="text-sm font-medium text-muted-foreground hover:underline"
              >
                Latest DAK →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
