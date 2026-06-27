import { differenceInCalendarDays, parseISO } from "date-fns";

import { normalizeDakStatus } from "@/features/dak/lib/workflow";
import type { DakStatus } from "@/types";

interface PendingDaysInput {
  receivedDate: string | null;
  createdAt: string;
  status: DakStatus | string;
  disposedDate?: string | null;
  closedDate?: string | null;
}

/** Calendar days a DAK has been pending (from receipt until completion/closure/today). */
export function calculatePendingDays({
  receivedDate,
  createdAt,
  status,
  disposedDate,
  closedDate,
}: PendingDaysInput): number {
  const normalized = normalizeDakStatus(status);
  const startRaw = receivedDate ?? createdAt;
  const start = parseISO(startRaw.slice(0, 10));

  let end = new Date();

  if (normalized === "completed" && disposedDate) {
    end = parseISO(disposedDate.slice(0, 10));
  } else if (normalized === "closed" && closedDate) {
    end = parseISO(closedDate.slice(0, 10));
  } else if (normalized === "completed" || normalized === "closed") {
    end = new Date();
  }

  return Math.max(0, differenceInCalendarDays(end, start));
}

export function formatPendingDays(days: number): string {
  if (days === 0) return "Received today";
  if (days === 1) return "Pending 1 day";
  return `Pending ${days} days`;
}
