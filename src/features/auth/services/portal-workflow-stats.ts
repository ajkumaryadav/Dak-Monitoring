import { createAdminClient } from "@/lib/supabase/admin";

export interface PortalWorkflowStatusRow {
  label: string;
  short: string;
  value: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

type WorkflowBucketKey =
  | "received"
  | "assigned"
  | "under_process"
  | "pending"
  | "escalated"
  | "disposed";

const BUCKET_META: Record<
  WorkflowBucketKey,
  Omit<PortalWorkflowStatusRow, "value">
> = {
  received: {
    label: "Received",
    short: "RCV",
    color: "#64748b",
    gradientFrom: "#94a3b8",
    gradientTo: "#475569",
  },
  assigned: {
    label: "Assigned",
    short: "ASN",
    color: "#1e40af",
    gradientFrom: "#3b82f6",
    gradientTo: "#1e3a8a",
  },
  under_process: {
    label: "Under Process",
    short: "PROC",
    color: "#2563eb",
    gradientFrom: "#60a5fa",
    gradientTo: "#1d4ed8",
  },
  pending: {
    label: "Pending",
    short: "PND",
    color: "#f59e0b",
    gradientFrom: "#fbbf24",
    gradientTo: "#d97706",
  },
  escalated: {
    label: "Escalated",
    short: "ESC",
    color: "#ef4444",
    gradientFrom: "#f87171",
    gradientTo: "#dc2626",
  },
  disposed: {
    label: "Disposed",
    short: "DSP",
    color: "#10b981",
    gradientFrom: "#34d399",
    gradientTo: "#059669",
  },
};

const BUCKET_ORDER: WorkflowBucketKey[] = [
  "received",
  "assigned",
  "under_process",
  "pending",
  "escalated",
  "disposed",
];

const TERMINAL_STATUSES = new Set(["completed", "closed", "disposed"]);

function classifyEntry(
  status: string,
  escalationLevel: number
): WorkflowBucketKey {
  const normalized = status.toLowerCase();

  if (TERMINAL_STATUSES.has(normalized)) {
    return "disposed";
  }

  if (escalationLevel >= 1) {
    return "escalated";
  }

  if (normalized === "received") return "received";
  if (normalized === "assigned") return "assigned";
  if (normalized === "in_progress" || normalized === "under_process") {
    return "under_process";
  }
  if (normalized === "pending") return "pending";
  if (normalized === "atr_submitted" || normalized === "pending_approval") {
    return "under_process";
  }

  return "pending";
}

function emptyWorkflowStats(): PortalWorkflowStatusRow[] {
  return BUCKET_ORDER.map((key) => ({
    ...BUCKET_META[key],
    value: 0,
  }));
}

/** Live district-wide DAK workflow counts for the public login portal. */
export async function fetchPortalWorkflowStats(): Promise<PortalWorkflowStatusRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("dak_entries")
      .select("status, escalation_level");

    if (error) {
      console.error("[fetchPortalWorkflowStats]", error.message);
      return emptyWorkflowStats();
    }

    const counts = new Map<WorkflowBucketKey, number>(
      BUCKET_ORDER.map((key) => [key, 0])
    );

    for (const row of data ?? []) {
      const bucket = classifyEntry(
        (row.status as string) ?? "received",
        (row.escalation_level as number) ?? 0
      );
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }

    return BUCKET_ORDER.map((key) => ({
      ...BUCKET_META[key],
      value: counts.get(key) ?? 0,
    }));
  } catch (error) {
    console.error(
      "[fetchPortalWorkflowStats]",
      error instanceof Error ? error.message : "Unknown error"
    );
    return emptyWorkflowStats();
  }
}
