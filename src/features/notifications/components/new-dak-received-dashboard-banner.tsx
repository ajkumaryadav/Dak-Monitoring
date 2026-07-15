"use client";

import Link from "next/link";
import { FilePlus2, X } from "lucide-react";
import { useState } from "react";

import { useNotifications } from "@/features/notifications/components/notification-realtime-provider";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface NewDakReceivedDashboardBannerProps {
  role: UserRole;
}

/**
 * Persistent dashboard flash banner (same pattern as ATR/Compliance banner)
 * when unread new-DAK notifications exist for Collector / ADM / ACP.
 */
export function NewDakReceivedDashboardBanner({
  role,
}: NewDakReceivedDashboardBannerProps) {
  const { notifications } = useNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (role !== "collector" && role !== "adm" && role !== "acp") {
    return null;
  }

  const unreadNewDaks = notifications.filter(
    (n) => n.type === "dak_created" && !n.readAt
  );

  if (dismissed || unreadNewDaks.length === 0) {
    return null;
  }

  const count = unreadNewDaks.length;
  const latest = unreadNewDaks[0];
  const queueHref =
    role === "acp" ? "/dashboard/dak/pending" : "/dashboard/dak/assignments";
  const openHref =
    count === 1 && latest?.dakId
      ? `/dashboard/dak/${latest.dakId}`
      : queueHref;

  return (
    <div
      role="alert"
      className={cn(
        "relative overflow-hidden rounded-xl border border-amber-500/40",
        "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent",
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
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
          <FilePlus2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-amber-950 dark:text-amber-100">
            {count === 1
              ? "New DAK received from DAK Operator"
              : `${count} new DAKs received from DAK Operator`}
          </p>
          <p className="mt-0.5 text-xs text-amber-950/80 dark:text-amber-100/80">
            {latest?.body ??
              "A new file is awaiting review and assignment."}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href={openHref}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {count === 1 ? "Open DAK →" : "Open Pending Assignment →"}
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
