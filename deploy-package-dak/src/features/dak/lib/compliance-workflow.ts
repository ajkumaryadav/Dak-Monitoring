import {
  isTerminalStatus,
  normalizeDakStatus,
} from "@/features/dak/lib/workflow";
import type { DakStatus } from "@/types";

export type ProgressStepState = "complete" | "current" | "pending";

export interface ComplianceProgressStep {
  id: string;
  label: string;
  state: ProgressStepState;
}

/** Process-oriented status labels for departmental officers. */
export const PROCESS_STATUS_LABELS: Record<DakStatus, string> = {
  received: "Received",
  assigned: "Assigned",
  in_progress: "Under Process",
  pending: "Awaiting Action",
  atr_submitted: "Submitted to Collector",
  pending_approval: "Submitted to Collector",
  completed: "Disposed",
  closed: "Closed by Collector",
};

const LEGACY_PROCESS_LABELS: Record<string, string> = {
  under_process: "Under Process",
  disposed: "Disposed",
  escalated: "Awaiting Action",
};

export function formatProcessStatusLabel(status: string): string {
  const normalized = normalizeDakStatus(status);
  return (
    PROCESS_STATUS_LABELS[normalized] ??
    LEGACY_PROCESS_LABELS[status] ??
    PROCESS_STATUS_LABELS.received
  );
}

/** Statuses where the officer compliance workflow panel is shown. */
export function canShowComplianceWorkflow(status: string): boolean {
  const normalized = normalizeDakStatus(status);
  return [
    "assigned",
    "in_progress",
    "pending",
    "atr_submitted",
    "pending_approval",
  ].includes(normalized);
}

/** Officer may edit compliance (draft/submit) in these statuses. */
export function canEditCompliance(status: string): boolean {
  const normalized = normalizeDakStatus(status);
  return ["assigned", "in_progress", "pending"].includes(normalized);
}

/** Read-only compliance view after submission or closure. */
export function isComplianceReadOnly(status: string): boolean {
  const normalized = normalizeDakStatus(status);
  return (
    isTerminalStatus(status) ||
    ["pending_approval", "atr_submitted", "closed", "completed"].includes(
      normalized
    )
  );
}

export function getComplianceProgressSteps(
  status: string,
  options: {
    hasAtrFile: boolean;
    hasDraft: boolean;
  }
): ComplianceProgressStep[] {
  const normalized = normalizeDakStatus(status);
  const { hasAtrFile, hasDraft } = options;

  const steps = [
    { id: "assigned", label: "Assigned" },
    { id: "opened", label: "Under Process" },
    { id: "atr", label: "ATR Uploaded" },
    { id: "submitted", label: "Submitted to Collector" },
    { id: "closed", label: "Closed" },
  ] as const;

  const assignedDone = normalized !== "received";
  const openedDone = ["in_progress", "pending", "atr_submitted", "pending_approval", "closed", "completed"].includes(
    normalized
  );
  const atrDone =
    hasAtrFile ||
    hasDraft ||
    ["atr_submitted", "pending_approval", "closed", "completed"].includes(
      normalized
    );
  const submittedDone = ["pending_approval", "closed", "completed"].includes(
    normalized
  );
  const closedDone = ["closed", "completed"].includes(normalized);

  const flags = [assignedDone, openedDone, atrDone, submittedDone, closedDone];

  let currentIndex = flags.findIndex((done, index) => !done);
  if (currentIndex === -1) {
    currentIndex = steps.length - 1;
  }

  return steps.map((step, index) => {
    let state: ProgressStepState = "pending";
    if (flags[index]) {
      state = "complete";
    } else if (index === currentIndex) {
      state = "current";
    }
    return { id: step.id, label: step.label, state };
  });
}

export {
  buildComplianceVersionHistory,
  extractCollectorReturnNotice,
  shouldShowReworkBanner,
  type CollectorReturnNotice,
  type ComplianceVersion,
  type ComplianceVersionStatus,
} from "@/features/dak/lib/compliance-rework";
