import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeTaskProgress,
  type TaskAssigneeStatus,
  type TaskProgressSummary,
} from "@/features/tasks/lib/task-types";

export interface TaskAssigneeRecord {
  id: string;
  taskId: string;
  departmentId: string | null;
  assignedTo: string;
  isLead: boolean;
  sequenceOrder: number;
  isActive: boolean;
  status: TaskAssigneeStatus;
  actionSummary: string | null;
  completedAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  departmentName: string | null;
  officerName: string | null;
}

const ASSIGNEE_SELECT = `
  id,
  task_id,
  department_id,
  assigned_to,
  is_lead,
  sequence_order,
  is_active,
  status,
  action_summary,
  completed_at,
  activated_at,
  created_at,
  departments:departments!task_assignees_department_id_fkey(name),
  officer:users!task_assignees_assigned_to_fkey(name)
`;

function mapAssigneeRow(row: Record<string, unknown>): TaskAssigneeRecord {
  const dept = row.departments;
  const deptData = Array.isArray(dept) ? dept[0] : dept;
  const officer = row.officer;
  const officerData = Array.isArray(officer) ? officer[0] : officer;

  return {
    id: row.id as string,
    taskId: row.task_id as string,
    departmentId: (row.department_id as string | null) ?? null,
    assignedTo: row.assigned_to as string,
    isLead: row.is_lead as boolean,
    sequenceOrder: row.sequence_order as number,
    isActive: row.is_active as boolean,
    status: row.status as TaskAssigneeStatus,
    actionSummary: (row.action_summary as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    activatedAt: (row.activated_at as string | null) ?? null,
    createdAt: row.created_at as string,
    departmentName: (deptData as { name?: string } | null)?.name ?? null,
    officerName: (officerData as { name?: string } | null)?.name ?? null,
  };
}

/** All assignees for a master task (collector view). */
export async function getTaskAssignees(
  taskId: string
): Promise<TaskAssigneeRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_assignees")
    .select(ASSIGNEE_SELECT)
    .eq("task_id", taskId)
    .order("sequence_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getTaskAssignees]", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapAssigneeRow(row as Record<string, unknown>));
}

/** Current user's assignment on a task (department officer view). */
export async function getMyTaskAssignment(
  taskId: string,
  userId: string
): Promise<TaskAssigneeRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_assignees")
    .select(ASSIGNEE_SELECT)
    .eq("task_id", taskId)
    .eq("assigned_to", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapAssigneeRow(data as Record<string, unknown>);
}

/** Task IDs visible to a department user via assignee rows. */
export async function getTaskIdsForUser(userId: string): Promise<string[]> {
  const supabase = createAdminClient();

  const [assigneeResult, legacyResult] = await Promise.all([
    supabase.from("task_assignees").select("task_id").eq("assigned_to", userId),
    supabase.from("tasks").select("id").eq("assigned_to", userId),
  ]);

  if (assigneeResult.error) {
    console.error("[getTaskIdsForUser]", assigneeResult.error.message);
  }
  if (legacyResult.error) {
    console.error("[getTaskIdsForUser legacy]", legacyResult.error.message);
  }

  const ids = new Set<string>();
  for (const row of assigneeResult.data ?? []) {
    ids.add(row.task_id as string);
  }
  for (const row of legacyResult.data ?? []) {
    ids.add(row.id as string);
  }

  return [...ids];
}

/** Task IDs for a department (any assignee in that department). */
export async function getTaskIdsForDepartment(
  departmentId: string
): Promise<string[]> {
  const supabase = createAdminClient();

  const [assigneeResult, legacyResult] = await Promise.all([
    supabase
      .from("task_assignees")
      .select("task_id")
      .eq("department_id", departmentId),
    supabase.from("tasks").select("id").eq("department_id", departmentId),
  ]);

  if (assigneeResult.error) {
    console.error("[getTaskIdsForDepartment]", assigneeResult.error.message);
  }
  if (legacyResult.error) {
    console.error(
      "[getTaskIdsForDepartment legacy]",
      legacyResult.error.message
    );
  }

  const ids = new Set<string>();
  for (const row of assigneeResult.data ?? []) {
    ids.add(row.task_id as string);
  }
  for (const row of legacyResult.data ?? []) {
    ids.add(row.id as string);
  }

  return [...ids];
}

/** Progress summary for collector dashboard. */
export async function getTaskProgressForIds(
  taskIds: string[]
): Promise<Map<string, TaskProgressSummary>> {
  const map = new Map<string, TaskProgressSummary>();
  if (!taskIds.length) return map;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_assignees")
    .select("task_id, status")
    .in("task_id", taskIds);

  if (error) {
    console.error("[getTaskProgressForIds]", error.message);
    return map;
  }

  const grouped = new Map<string, { status: TaskAssigneeStatus }[]>();
  for (const row of data ?? []) {
    const taskId = row.task_id as string;
    const list = grouped.get(taskId) ?? [];
    list.push({ status: row.status as TaskAssigneeStatus });
    grouped.set(taskId, list);
  }

  for (const [taskId, assignees] of grouped) {
    map.set(taskId, computeTaskProgress(assignees));
  }

  return map;
}

export interface AssigneeComplianceRecord {
  id: string;
  assigneeId: string;
  complianceText: string;
  attachmentPath: string | null;
  createdAt: string;
  submitterName: string | null;
  downloadUrl: string | null;
}

const STORAGE_BUCKET = "dak-attachments";

/** Compliance submissions scoped to one assignee. */
export async function getAssigneeComplianceHistory(
  assigneeId: string
): Promise<AssigneeComplianceRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_compliance")
    .select(
      "id, assignee_id, compliance_text, attachment_path, created_at, submitter:users!task_compliance_submitted_by_fkey(name)"
    )
    .eq("assignee_id", assigneeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAssigneeComplianceHistory]", error.message);
    return [];
  }

  const records: AssigneeComplianceRecord[] = [];

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
      assigneeId: row.assignee_id as string,
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

export interface AssigneeTimelineEntry {
  id: string;
  action: string;
  remarks: string | null;
  createdAt: string;
  performerName: string | null;
}

/** Timeline entries for one assignee. */
export async function getAssigneeTimeline(
  assigneeId: string
): Promise<AssigneeTimelineEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("task_timeline")
    .select(
      "id, action, remarks, created_at, user:users!task_timeline_user_id_fkey(name)"
    )
    .eq("assignee_id", assigneeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAssigneeTimeline]", error.message);
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
