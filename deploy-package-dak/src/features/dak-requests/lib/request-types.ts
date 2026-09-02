/** Department-initiated workflow request types. */
export const DAK_REQUEST_TYPES = [
  { value: "transfer", label: "Request Transfer" },
  { value: "escalation", label: "Request Escalation" },
  { value: "extension", label: "Request Due Date Extension" },
  { value: "clarification", label: "Seek Clarification" },
] as const;

export type DakRequestType = (typeof DAK_REQUEST_TYPES)[number]["value"];

export type DakRequestStatus = "pending" | "approved" | "rejected";

export const DAK_REQUEST_STATUS_LABELS: Record<DakRequestStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export const DAK_REQUEST_PENDING_LABELS: Record<DakRequestType, string> = {
  transfer: "Transfer Request Pending",
  escalation: "Escalation Request Pending",
  extension: "Extension Request Pending",
  clarification: "Clarification Requested",
};

export const DAK_REQUEST_TYPE_LABELS: Record<DakRequestType, string> = {
  transfer: "Transfer Request",
  escalation: "Escalation Request",
  extension: "Extension Request",
  clarification: "Clarification Request",
};

export const DAK_REQUEST_BADGE_STYLES: Record<DakRequestType, string> = {
  transfer: "border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  escalation: "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300",
  extension: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  clarification: "border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300",
};

/** Statuses where department users may submit operational requests. */
export const DEPARTMENT_REQUEST_STATUSES = [
  "assigned",
  "in_progress",
  "pending",
] as const;
