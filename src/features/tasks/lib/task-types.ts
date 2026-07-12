/** Task category for district administrative work. */
export type TaskCategory =
  | "meeting"
  | "inspection"
  | "election"
  | "disaster"
  | "campaign"
  | "law_order"
  | "general";

export const TASK_CATEGORY_OPTIONS: { value: TaskCategory; label: string }[] = [
  { value: "meeting", label: "Meeting" },
  { value: "inspection", label: "Inspection" },
  { value: "election", label: "Election" },
  { value: "disaster", label: "Disaster / Flood" },
  { value: "campaign", label: "Campaign (Swachhta, etc.)" },
  { value: "law_order", label: "Law & Order" },
  { value: "general", label: "General" },
];

/** How assignees receive and execute the task. */
export type TaskAssignmentMode = "parallel" | "sequential" | "hybrid";

export const TASK_ASSIGNMENT_MODE_OPTIONS: {
  value: TaskAssignmentMode;
  label: string;
  description: string;
}[] = [
  {
    value: "parallel",
    label: "Parallel Assignment",
    description: "All departments receive the task simultaneously (default).",
  },
  {
    value: "sequential",
    label: "Sequential Assignment",
    description: "Next department receives the task only after the previous completes.",
  },
  {
    value: "hybrid",
    label: "Hybrid (Lead + Supporting)",
    description:
      "Lead department coordinates; supporting departments work in parallel.",
  },
];

/** Per-assignee execution status. */
export type TaskAssigneeStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed";

export const ASSIGNEE_COMPLETED: TaskAssigneeStatus = "completed";

export const ASSIGNEE_IN_PROGRESS: TaskAssigneeStatus[] = [
  "accepted",
  "in_progress",
];

export const ASSIGNEE_PENDING: TaskAssigneeStatus[] = ["pending", "assigned"];

export function getAssigneeDisplayStatus(
  status: TaskAssigneeStatus
): "Pending" | "In Progress" | "Completed" {
  if (status === "completed") return "Completed";
  if (ASSIGNEE_IN_PROGRESS.includes(status)) return "In Progress";
  return "Pending";
}

export interface TaskProgressSummary {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionPct: number;
}

export function computeTaskProgress(
  assignees: { status: TaskAssigneeStatus }[]
): TaskProgressSummary {
  const total = assignees.length;
  const completed = assignees.filter((a) => a.status === "completed").length;
  const inProgress = assignees.filter((a) =>
    ASSIGNEE_IN_PROGRESS.includes(a.status)
  ).length;
  const pending = assignees.filter((a) =>
    ASSIGNEE_PENDING.includes(a.status)
  ).length;

  return {
    total,
    completed,
    inProgress,
    pending,
    completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
