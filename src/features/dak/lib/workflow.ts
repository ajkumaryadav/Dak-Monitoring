import type { DakStatus } from "@/types";

/** Human-readable labels for workflow statuses. */
export const STATUS_LABELS: Record<DakStatus, string> = {
  received: "Received",
  assigned: "Assigned",
  in_progress: "In Progress",
  pending: "Pending",
  completed: "Completed",
  closed: "Closed",
};

/**
 * Valid forward transitions:
 * DEO Entry → Collector/ADM Assignment → Department Officer → Action → Completed → Closed
 */
export const STATUS_TRANSITIONS: Record<DakStatus, readonly DakStatus[]> = {
  received: ["assigned"],
  assigned: ["in_progress", "pending"],
  in_progress: ["pending", "completed"],
  pending: ["in_progress", "completed"],
  completed: ["closed"],
  closed: [],
};

export const TERMINAL_STATUSES: readonly DakStatus[] = ["completed", "closed"];

export const ACTIVE_STATUSES: readonly DakStatus[] = [
  "received",
  "assigned",
  "in_progress",
  "pending",
];

/** Legacy DB enum values mapped to the current workflow model. */
const LEGACY_STATUS_MAP: Record<string, DakStatus> = {
  under_process: "in_progress",
  disposed: "completed",
  escalated: "pending",
};

/** Status values still stored in older databases. */
export const LEGACY_ACTIVE_DB_STATUSES = [
  "under_process",
  "escalated",
] as const;

export const LEGACY_COMPLETED_DB_STATUSES = ["disposed"] as const;

export function normalizeDakStatus(status: string): DakStatus {
  if (status in STATUS_LABELS) {
    return status as DakStatus;
  }

  return LEGACY_STATUS_MAP[status] ?? "received";
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[normalizeDakStatus(status)];
}

export function getAllowedTransitions(status: string): DakStatus[] {
  const normalized = normalizeDakStatus(status);
  return [...(STATUS_TRANSITIONS[normalized] ?? [])];
}

export function canTransition(from: string, to: DakStatus): boolean {
  return getAllowedTransitions(from).includes(to);
}

export function isTerminalStatus(status: string): boolean {
  const normalized = normalizeDakStatus(status);
  return (
    TERMINAL_STATUSES.includes(normalized) ||
    LEGACY_COMPLETED_DB_STATUSES.includes(
      status as (typeof LEGACY_COMPLETED_DB_STATUSES)[number]
    )
  );
}

export function isActiveStatus(status: string): boolean {
  if (isTerminalStatus(status)) {
    return false;
  }

  const normalized = normalizeDakStatus(status);
  return (
    ACTIVE_STATUSES.includes(normalized) ||
    LEGACY_ACTIVE_DB_STATUSES.includes(
      status as (typeof LEGACY_ACTIVE_DB_STATUSES)[number]
    ) ||
    normalized === "received"
  );
}

export function canAssignStatus(status: string): boolean {
  return normalizeDakStatus(status) === "received";
}
