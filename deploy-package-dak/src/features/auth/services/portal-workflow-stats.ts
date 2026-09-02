import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import {
  isTerminalStatus,
  normalizeDakStatus,
} from "@/features/dak/lib/workflow";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PortalWorkflowStatusRow {
  label: string;
  short: string;
  value: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export type PortalWorkflowStatsResult = {
  rows: PortalWorkflowStatusRow[];
  unavailable: boolean;
};

export interface PortalGlanceMetric {
  label: string;
  value: number;
  color: string;
}

export interface PortalGlanceStat {
  value: string;
  label: string;
  accent: string;
  ring: string;
}

export interface PortalGlanceNode {
  key: "collectorate" | "departments" | "dakFiles" | "audit";
  label: string;
  count: number;
  delay: string;
}

export type PortalDistrictGlanceData = {
  unavailable: boolean;
  totalDak: number;
  pending: number;
  completed: number;
  overdue: number;
  completionRate: number;
  departments: number;
  officers: number;
  stats: PortalGlanceStat[];
  metrics: PortalGlanceMetric[];
  nodes: PortalGlanceNode[];
};

export type PortalPublicStats = {
  workflow: PortalWorkflowStatsResult;
  glance: PortalDistrictGlanceData;
};

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

const PAGE_SIZE = 1000;

function classifyEntry(
  status: string,
  escalationLevel: number
): WorkflowBucketKey {
  const raw = status.toLowerCase();
  const normalized = normalizeDakStatus(status);

  if (normalized === "completed" || normalized === "closed") {
    return "disposed";
  }

  if (normalized === "received") return "received";
  if (normalized === "assigned") return "assigned";

  if (raw === "escalated" || escalationLevel >= 1) {
    return "escalated";
  }

  if (
    normalized === "in_progress" ||
    normalized === "atr_submitted" ||
    normalized === "pending_approval"
  ) {
    return "under_process";
  }

  if (normalized === "pending") return "pending";

  return "pending";
}

function emptyWorkflowStats(): PortalWorkflowStatusRow[] {
  return BUCKET_ORDER.map((key) => ({
    ...BUCKET_META[key],
    value: 0,
  }));
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function emptyGlance(): PortalDistrictGlanceData {
  return {
    unavailable: true,
    totalDak: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0,
    departments: 0,
    officers: 0,
    stats: [
      {
        value: "0",
        label: "Total DAK",
        accent: "text-sky-600",
        ring: "ring-sky-500/25",
      },
      {
        value: "0",
        label: "Pending",
        accent: "text-amber-600",
        ring: "ring-amber-500/25",
      },
      {
        value: "0",
        label: "Closed",
        accent: "text-emerald-600",
        ring: "ring-emerald-500/25",
      },
    ],
    metrics: [
      {
        label: "Digital File Movement",
        value: 0,
        color: "from-sky-500 to-blue-600",
      },
      {
        label: "Compliance & ATR Review",
        value: 0,
        color: "from-violet-500 to-purple-600",
      },
      {
        label: "On-time / Not Overdue",
        value: 0,
        color: "from-amber-500 to-orange-600",
      },
      {
        label: "Active Officers Online",
        value: 0,
        color: "from-emerald-500 to-teal-600",
      },
    ],
    nodes: [
      { key: "collectorate", label: "Collectorate", count: 0, delay: "0s" },
      { key: "departments", label: "Departments", count: 0, delay: "0.4s" },
      { key: "dakFiles", label: "DAK Files", count: 0, delay: "0.8s" },
      { key: "audit", label: "Closed", count: 0, delay: "1.2s" },
    ],
  };
}

function buildGlanceFromCounts(input: {
  total: number;
  received: number;
  assigned: number;
  inProgress: number;
  pendingStatus: number;
  atrOrApproval: number;
  completed: number;
  overdue: number;
  departments: number;
  officers: number;
}): PortalDistrictGlanceData {
  const pending =
    input.received +
    input.assigned +
    input.inProgress +
    input.pendingStatus +
    input.atrOrApproval;

  const movedBeyondReceipt = Math.max(0, input.total - input.received);
  const complianceTouched = input.atrOrApproval + input.completed;
  const onTimeShare =
    input.total > 0
      ? pct(input.total - input.overdue, input.total)
      : 0;

  const completionRate = pct(input.completed, input.total);

  return {
    unavailable: false,
    totalDak: input.total,
    pending,
    completed: input.completed,
    overdue: input.overdue,
    completionRate,
    departments: input.departments,
    officers: input.officers,
    stats: [
      {
        value: String(input.total),
        label: "Total DAK",
        accent: "text-sky-600",
        ring: "ring-sky-500/25",
      },
      {
        value: String(pending),
        label: "Pending",
        accent: "text-amber-600",
        ring: "ring-amber-500/25",
      },
      {
        value: String(input.completed),
        label: "Closed",
        accent: "text-emerald-600",
        ring: "ring-emerald-500/25",
      },
    ],
    metrics: [
      {
        label: "Digital File Movement",
        value: pct(movedBeyondReceipt, input.total),
        color: "from-sky-500 to-blue-600",
      },
      {
        label: "Compliance & ATR Review",
        value: pct(complianceTouched, input.total),
        color: "from-violet-500 to-purple-600",
      },
      {
        label: "On-time / Not Overdue",
        value: onTimeShare,
        color: "from-amber-500 to-orange-600",
      },
      {
        label: "Active Officers",
        value: input.officers > 0 ? 100 : 0,
        color: "from-emerald-500 to-teal-600",
      },
    ],
    nodes: [
      {
        key: "collectorate",
        label: "Awaiting",
        count: input.received,
        delay: "0s",
      },
      {
        key: "departments",
        label: "In Depts",
        count: input.assigned + input.inProgress + input.pendingStatus,
        delay: "0.4s",
      },
      {
        key: "dakFiles",
        label: "DAK Files",
        count: input.total,
        delay: "0.8s",
      },
      {
        key: "audit",
        label: "Closed",
        count: input.completed,
        delay: "1.2s",
      },
    ],
  };
}

/** Live district-wide DAK workflow counts for the public login portal. */
export async function fetchPortalWorkflowStats(): Promise<PortalWorkflowStatusRow[]> {
  const result = await fetchPortalPublicStats();
  return result.workflow.rows;
}

/** Same as fetchPortalWorkflowStats, with an unavailable flag for UI messaging. */
export async function fetchPortalWorkflowStatsDetailed(): Promise<PortalWorkflowStatsResult> {
  const result = await fetchPortalPublicStats();
  return result.workflow;
}

/** Live District Administration at a Glance metrics for the login portal. */
export async function fetchPortalDistrictGlance(): Promise<PortalDistrictGlanceData> {
  const result = await fetchPortalPublicStats();
  return result.glance;
}

/**
 * One district-wide read for login portal charts: workflow buckets + glance metrics.
 */
export async function fetchPortalPublicStats(): Promise<PortalPublicStats> {
  try {
    const supabase = createAdminClient();
    const today = getDistrictDateString();

    const counts = new Map<WorkflowBucketKey, number>(
      BUCKET_ORDER.map((key) => [key, 0])
    );

    let total = 0;
    let received = 0;
    let assigned = 0;
    let inProgress = 0;
    let pendingStatus = 0;
    let atrOrApproval = 0;
    let completed = 0;
    let overdue = 0;

    let from = 0;
    let fetched = 0;

    do {
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("dak_entries")
        .select("status, escalation_level, due_date")
        .range(from, to);

      if (error) {
        console.error("[fetchPortalPublicStats]", error.message);
        return {
          workflow: { rows: emptyWorkflowStats(), unavailable: true },
          glance: emptyGlance(),
        };
      }

      const rows = data ?? [];
      fetched = rows.length;

      for (const row of rows) {
        total += 1;
        const status = (row.status as string) ?? "received";
        const escalation = Number(row.escalation_level ?? 0);
        const dueDate = row.due_date as string | null;
        const normalized = normalizeDakStatus(status);

        const bucket = classifyEntry(status, escalation);
        counts.set(bucket, (counts.get(bucket) ?? 0) + 1);

        if (isTerminalStatus(status)) {
          completed += 1;
        } else {
          if (normalized === "received") received += 1;
          else if (normalized === "assigned") assigned += 1;
          else if (normalized === "in_progress") inProgress += 1;
          else if (normalized === "pending") pendingStatus += 1;
          else if (
            normalized === "atr_submitted" ||
            normalized === "pending_approval"
          ) {
            atrOrApproval += 1;
          } else {
            pendingStatus += 1;
          }

          if (dueDate && dueDate < today) {
            overdue += 1;
          }
        }
      }

      from += PAGE_SIZE;
    } while (fetched === PAGE_SIZE);

    const [{ count: departmentCount }, { count: officerCount }] =
      await Promise.all([
        supabase
          .from("departments")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
      ]);

    const glance = buildGlanceFromCounts({
      total,
      received,
      assigned,
      inProgress,
      pendingStatus,
      atrOrApproval,
      completed,
      overdue,
      departments: departmentCount ?? 0,
      officers: officerCount ?? 0,
    });

    return {
      workflow: {
        rows: BUCKET_ORDER.map((key) => ({
          ...BUCKET_META[key],
          value: counts.get(key) ?? 0,
        })),
        unavailable: false,
      },
      glance,
    };
  } catch (error) {
    console.error(
      "[fetchPortalPublicStats]",
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      workflow: { rows: emptyWorkflowStats(), unavailable: true },
      glance: emptyGlance(),
    };
  }
}
