import type { DakStatus } from "@/types";

/** Human-readable labels for workflow statuses. */
export const STATUS_LABELS: Record<DakStatus, string> = {
  received: "Received",
  assigned: "Assigned",
  under_process: "Under Process",
  pending: "Pending",
  escalated: "Escalated",
  disposed: "Disposed",
  closed: "Closed",
};

/** Valid forward transitions per AGENTS.md workflow. */
export const STATUS_TRANSITIONS: Record<DakStatus, readonly DakStatus[]> = {
  received: ["assigned", "pending"],
  assigned: ["under_process", "pending", "escalated"],
  under_process: ["pending", "escalated", "disposed"],
  pending: ["assigned", "under_process", "escalated"],
  escalated: ["under_process", "disposed"],
  disposed: ["closed"],
  closed: [],
};

export const TERMINAL_STATUSES: readonly DakStatus[] = ["disposed", "closed"];

export const ACTIVE_STATUSES: readonly DakStatus[] = [
  "received",
  "assigned",
  "under_process",
  "pending",
  "escalated",
];

export function getStatusLabel(status: DakStatus): string {
  return STATUS_LABELS[status];
}

export function getAllowedTransitions(status: DakStatus): DakStatus[] {
  return [...(STATUS_TRANSITIONS[status] ?? [])];
}

export function canTransition(from: DakStatus, to: DakStatus): boolean {
  return getAllowedTransitions(from).includes(to);
}

export function isTerminalStatus(status: DakStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
