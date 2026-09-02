import type { DakStatus } from "@/types";

/** Human-readable labels for workflow statuses. */
export const STATUS_LABELS: Record<DakStatus, string> = {
  received: "Received",
  assigned: "Assigned",
  in_progress: "In Progress",
  pending: "Pending",
  atr_submitted: "ATR Submitted",
  pending_approval: "Pending Approval",
  completed: "Completed",
  closed: "Closed",
};

/**
 * Valid forward transitions:
 * DEO Entry → Collector Assignment → Department Officer → ATR → Collector Approval → Closed
 */
export const STATUS_TRANSITIONS: Record<DakStatus, readonly DakStatus[]> = {
  received: ["assigned"],
  assigned: ["in_progress", "pending"],
  in_progress: ["pending"],
  pending: ["in_progress"],
  atr_submitted: ["pending_approval"],
  pending_approval: ["closed", "in_progress"],
  completed: ["closed"],
  closed: [],
};

/** Status options shown on the department officer status form. */
export const DEPARTMENT_STATUS_TRANSITIONS: Partial<
  Record<DakStatus, readonly DakStatus[]>
> = {
  assigned: ["in_progress", "pending"],
  in_progress: ["pending"],
  pending: ["in_progress"],
};

export const TERMINAL_STATUSES: readonly DakStatus[] = ["completed", "closed"];

export const ACTIVE_STATUSES: readonly DakStatus[] = [
  "received",
  "assigned",
  "in_progress",
  "pending",
  "atr_submitted",
  "pending_approval",
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
  return [...(DEPARTMENT_STATUS_TRANSITIONS[normalized] ?? [])];
}

export function getCollectorAllowedTransitions(status: string): DakStatus[] {
  const normalized = normalizeDakStatus(status);
  if (normalized === "pending_approval") {
    return [];
  }
  return [...(STATUS_TRANSITIONS[normalized] ?? [])];
}

export function canTransition(from: string, to: DakStatus): boolean {
  const normalized = normalizeDakStatus(from);
  return [...(STATUS_TRANSITIONS[normalized] ?? [])].includes(to);
}

export function canDepartmentTransition(from: string, to: DakStatus): boolean {
  const normalized = normalizeDakStatus(from);
  return [...(DEPARTMENT_STATUS_TRANSITIONS[normalized] ?? [])].includes(to);
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

/** Active statuses where the Collector may change department/section allocation. */
export function canReassignStatus(status: string): boolean {
  const normalized = normalizeDakStatus(status);
  return ["assigned", "in_progress", "pending", "atr_submitted"].includes(
    normalized
  );
}

export function canApproveClosure(status: string): boolean {
  return normalizeDakStatus(status) === "pending_approval";
}

export function canSubmitAtrStatus(status: string): boolean {
  const normalized = normalizeDakStatus(status);
  return ["assigned", "in_progress", "pending"].includes(normalized);
}
