/** Department-initiated workflow request types. */
export const DAK_REQUEST_TYPES = [
  { value: "transfer", label: "Request Transfer" },
  { value: "escalation", label: "Request Escalation" },
  { value: "extension", label: "Request Due Date Extension" },
] as const;

export type DakRequestType = (typeof DAK_REQUEST_TYPES)[number]["value"];

export type DakRequestStatus = "pending" | "approved" | "rejected";

export const DAK_REQUEST_STATUS_LABELS: Record<DakRequestStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export const DAK_REQUEST_TYPE_LABELS: Record<DakRequestType, string> = {
  transfer: "Transfer Request",
  escalation: "Escalation Request",
  extension: "Extension Request",
};

/** Statuses where department users may submit operational requests. */
export const DEPARTMENT_REQUEST_STATUSES = [
  "assigned",
  "in_progress",
  "pending",
] as const;
