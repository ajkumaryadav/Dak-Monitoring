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

  const { data, error } = await query;
  if (error) {
    console.error("[getTasks]", error.message);
    return [];
  }
  return (data ?? []) as TaskRecord[];
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
