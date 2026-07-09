import { createAdminClient } from "@/lib/supabase/admin";
import type { PriorityLevel } from "@/types";

export type TaskStatus =
  | "draft"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "compliance_submitted"
  | "approved"
  | "closed";

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  priority: PriorityLevel;
  due_date: string | null;
  status: TaskStatus;
  remarks: string | null;
  created_at: string;
  departments: { name: string } | { name: string }[] | null;
  assignee: { name: string } | { name: string }[] | null;
}

const TASK_SELECT =
  "id, title, description, department_id, assigned_to, assigned_by, priority, due_date, status, remarks, created_at, departments(name), assignee:users!tasks_assigned_to_fkey(name)";

export async function getTasks(scope?: {
  departmentId?: string | null;
  assignedTo?: string | null;
  status?: TaskStatus | "pending" | "completed" | "overdue";
  priority?: PriorityLevel;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TaskRecord[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });

  if (scope?.departmentId) {
    query = query.eq("department_id", scope.departmentId);
  }
  if (scope?.assignedTo) {
    query = query.eq("assigned_to", scope.assignedTo);
  }
  if (scope?.priority) {
    query = query.eq("priority", scope.priority);
  }
  if (scope?.dateFrom) {
    query = query.gte("due_date", scope.dateFrom);
  }
  if (scope?.dateTo) {
    query = query.lte("due_date", scope.dateTo);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getTasks]", error.message);
    return [];
  }

  let tasks = (data ?? []) as TaskRecord[];
  const today = new Date().toISOString().slice(0, 10);

  if (scope?.status === "pending") {
    tasks = tasks.filter((t) => !COMPLETED_STATUSES.includes(t.status));
  } else if (scope?.status === "completed") {
    tasks = tasks.filter((t) => COMPLETED_STATUSES.includes(t.status));
  } else if (scope?.status === "overdue") {
    tasks = tasks.filter(
      (t) =>
        !COMPLETED_STATUSES.includes(t.status) &&
        t.due_date &&
        t.due_date < today
    );
  } else if (scope?.status) {
    tasks = tasks.filter((t) => t.status === scope.status);
  }

  return tasks;
}

export async function getTaskById(id: string): Promise<TaskRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as TaskRecord;
}

export interface TaskStatsSummary {
  total: number;
  assigned: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionPct: number;
}

const COMPLETED_STATUSES: TaskStatus[] = ["approved", "closed"];
const IN_PROGRESS_STATUSES: TaskStatus[] = [
  "accepted",
  "in_progress",
  "compliance_submitted",
];

export async function getTaskStats(scope?: {
  departmentId?: string | null;
  assignedTo?: string | null;
}): Promise<TaskStatsSummary> {
  const tasks = await getTasks(scope);
  const today = new Date().toISOString().slice(0, 10);

  const completed = tasks.filter((t) => COMPLETED_STATUSES.includes(t.status));
  const active = tasks.filter((t) => !COMPLETED_STATUSES.includes(t.status));
  const assigned = tasks.filter(
    (t) => t.status !== "draft" && !COMPLETED_STATUSES.includes(t.status)
  );
  const inProgress = tasks.filter((t) => IN_PROGRESS_STATUSES.includes(t.status));
  const overdue = active.filter((t) => t.due_date && t.due_date < today);

  return {
    total: tasks.length,
    assigned: assigned.length,
    pending: active.length,
    inProgress: inProgress.length,
    completed: completed.length,
    overdue: overdue.length,
    completionPct:
      tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
  };
}

export interface TaskTimelineEntry {
  id: string;
  action: string;
  remarks: string | null;
  createdAt: string;
  performerName: string | null;
}

export interface TaskComplianceRecord {
  id: string;
  complianceText: string;
  attachmentPath: string | null;
  createdAt: string;
  submitterName: string | null;
  downloadUrl: string | null;
}

const STORAGE_BUCKET = "dak-attachments";

export async function getTaskTimeline(
  taskId: string
): Promise<TaskTimelineEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_timeline")
    .select(
      "id, action, remarks, created_at, user:users!task_timeline_user_id_fkey(name)"
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[getTaskTimeline]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const user = row.user;
    const userData = Array.isArray(user) ? user[0] : user;
    return {
      id: row.id as string,
      action: row.action as string,
      remarks: (row.remarks as string | null) ?? null,
      createdAt: row.created_at as string,
      performerName: (userData as { name?: string } | null)?.name ?? null,
    };
  });
}

export async function getTaskComplianceHistory(
  taskId: string
): Promise<TaskComplianceRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_compliance")
    .select(
      "id, compliance_text, attachment_path, created_at, submitter:users!task_compliance_submitted_by_fkey(name)"
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getTaskComplianceHistory]", error.message);
    return [];
  }

  const records: TaskComplianceRecord[] = [];

  for (const row of data ?? []) {
    const submitter = row.submitter;
    const submitterData = Array.isArray(submitter) ? submitter[0] : submitter;
    const attachmentPath = row.attachment_path as string | null;
    let downloadUrl: string | null = null;

    if (attachmentPath) {
      const { data: signed } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(attachmentPath, 3600);
      downloadUrl = signed?.signedUrl ?? null;
    }

    records.push({
      id: row.id as string,
      complianceText: row.compliance_text as string,
      attachmentPath,
      createdAt: row.created_at as string,
      submitterName:
        (submitterData as { name?: string } | null)?.name ?? null,
      downloadUrl,
    });
  }

  return records;
}
