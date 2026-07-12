import { createAdminClient } from "@/lib/supabase/admin";
import type { PriorityLevel } from "@/types";
import {
  computeTaskProgress,
  type TaskAssignmentMode,
  type TaskCategory,
  type TaskProgressSummary,
} from "@/features/tasks/lib/task-types";
import {
  getTaskIdsForDepartment,
  getTaskIdsForUser,
  getTaskProgressForIds,
} from "@/features/tasks/services/task-assignees";

export type TaskStatus =
  | "draft"
  | "assigned"
  | "awaiting_consolidation"
  | "closed"
  | "accepted"
  | "in_progress"
  | "compliance_submitted"
  | "approved";

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  assignment_mode: TaskAssignmentMode;
  lead_department_id: string | null;
  department_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  priority: PriorityLevel;
  due_date: string | null;
  status: TaskStatus;
  remarks: string | null;
  consolidated_report_text: string | null;
  consolidated_report_path: string | null;
  consolidated_report_at: string | null;
  created_at: string;
  closed_at: string | null;
  departments: { name: string } | { name: string }[] | null;
  assignee: { name: string } | { name: string }[] | null;
  progress?: TaskProgressSummary;
  assigneeCount?: number;
}

const TASK_SELECT = `
  id,
  title,
  description,
  category,
  assignment_mode,
  lead_department_id,
  department_id,
  assigned_to,
  assigned_by,
  priority,
  due_date,
  status,
  remarks,
  consolidated_report_text,
  consolidated_report_path,
  consolidated_report_at,
  created_at,
  closed_at,
  departments:departments!tasks_department_id_fkey(name),
  assignee:users!tasks_assigned_to_fkey(name)
`;

const COMPLETED_STATUSES: TaskStatus[] = ["closed", "approved"];

export async function getTasks(scope?: {
  departmentId?: string | null;
  assignedTo?: string | null;
  taskIds?: string[];
  status?: TaskStatus | "pending" | "completed" | "overdue";
  priority?: PriorityLevel;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TaskRecord[]> {
  const supabase = createAdminClient();

  let taskIds = scope?.taskIds;

  if (scope?.assignedTo && !taskIds) {
    taskIds = await getTaskIdsForUser(scope.assignedTo);
  } else if (scope?.departmentId && !taskIds) {
    taskIds = await getTaskIdsForDepartment(scope.departmentId);
  }

  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });

  if (taskIds !== undefined) {
    if (!taskIds.length) return [];
    query = query.in("id", taskIds);
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

  const progressMap = await getTaskProgressForIds(tasks.map((t) => t.id));
  return tasks.map((task) => ({
    ...task,
    progress: progressMap.get(task.id),
    assigneeCount: progressMap.get(task.id)?.total ?? 0,
  }));
}

export async function getTaskById(id: string): Promise<TaskRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const progressMap = await getTaskProgressForIds([id]);
  return {
    ...(data as TaskRecord),
    progress: progressMap.get(id),
    assigneeCount: progressMap.get(id)?.total ?? 0,
  };
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

export async function getTaskStats(scope?: {
  departmentId?: string | null;
  assignedTo?: string | null;
}): Promise<TaskStatsSummary> {
  const tasks = await getTasks(scope);
  const today = new Date().toISOString().slice(0, 10);

  const completed = tasks.filter((t) => COMPLETED_STATUSES.includes(t.status));
  const active = tasks.filter((t) => !COMPLETED_STATUSES.includes(t.status));
  const assigned = active.filter((t) => t.status !== "draft");
  const inProgress = active.filter(
    (t) => t.progress && t.progress.inProgress > 0
  );
  const overdue = active.filter((t) => t.due_date && t.due_date < today);

  const totalAssignees = tasks.reduce(
    (sum, t) => sum + (t.progress?.total ?? 0),
    0
  );
  const completedAssignees = tasks.reduce(
    (sum, t) => sum + (t.progress?.completed ?? 0),
    0
  );

  return {
    total: tasks.length,
    assigned: assigned.length,
    pending: active.length,
    inProgress: inProgress.length,
    completed: completed.length,
    overdue: overdue.length,
    completionPct:
      totalAssignees > 0
        ? Math.round((completedAssignees / totalAssignees) * 100)
        : tasks.length > 0
          ? Math.round((completed.length / tasks.length) * 100)
          : 0,
  };
}

export interface TaskTimelineEntry {
  id: string;
  action: string;
  remarks: string | null;
  createdAt: string;
  performerName: string | null;
  assigneeId: string | null;
}

const STORAGE_BUCKET = "dak-attachments";

export async function getTaskTimeline(
  taskId: string,
  options?: { assigneeId?: string; masterOnly?: boolean }
): Promise<TaskTimelineEntry[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("task_timeline")
    .select(
      "id, action, remarks, created_at, assignee_id, user:users!task_timeline_user_id_fkey(name)"
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (options?.assigneeId) {
    query = query.eq("assignee_id", options.assigneeId);
  } else if (options?.masterOnly) {
    query = query.is("assignee_id", null);
  }

  const { data, error } = await query;

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
      assigneeId: (row.assignee_id as string | null) ?? null,
    };
  });
}

export interface TaskComplianceRecord {
  id: string;
  assigneeId: string | null;
  complianceText: string;
  attachmentPath: string | null;
  createdAt: string;
  submitterName: string | null;
  downloadUrl: string | null;
}

export async function getTaskComplianceHistory(
  taskId: string,
  options?: { assigneeId?: string }
): Promise<TaskComplianceRecord[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("task_compliance")
    .select(
      "id, assignee_id, compliance_text, attachment_path, created_at, submitter:users!task_compliance_submitted_by_fkey(name)"
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (options?.assigneeId) {
    query = query.eq("assignee_id", options.assigneeId);
  }

  const { data, error } = await query;

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
      assigneeId: (row.assignee_id as string | null) ?? null,
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

export async function getConsolidatedReportDownloadUrl(
  path: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export { computeTaskProgress };
