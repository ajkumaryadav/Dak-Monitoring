import {
  createNotifications,
  type CreateNotificationInput,
} from "@/features/notifications/services/notifications";

async function sendNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  if (!inputs.length) return;
  try {
    await createNotifications(inputs);
  } catch (error) {
    console.error("[notifyTaskEvent]", error);
  }
}

interface NotifyTaskAssignedParams {
  taskId: string;
  taskTitle: string;
  recipientUserIds: string[];
  assignedByName: string;
  dueDate?: string | null;
}

/** Notify officers when a task assignment is activated for them. */
export async function notifyTaskAssigned(
  params: NotifyTaskAssignedParams
): Promise<void> {
  const dueNote = params.dueDate ? ` Due: ${params.dueDate}.` : "";

  await sendNotifications(
    params.recipientUserIds.map((userId) => ({
      userId,
      type: "task_assigned",
      title: "Administrative Task Assigned",
      body: `${params.taskTitle} — assigned by ${params.assignedByName}.${dueNote}`,
      metadata: { taskId: params.taskId, taskTitle: params.taskTitle },
    }))
  );
}

interface NotifyAssigneeCompletedParams {
  taskId: string;
  taskTitle: string;
  assigneeName: string;
  collectorUserIds: string[];
}

/** Notify collector when an assignee submits their part. */
export async function notifyAssigneeCompleted(
  params: NotifyAssigneeCompletedParams
): Promise<void> {
  await sendNotifications(
    params.collectorUserIds.map((userId) => ({
      userId,
      type: "task_assignee_completed",
      title: "Task Submission Received",
      body: `${params.assigneeName} completed their part on "${params.taskTitle}".`,
      metadata: { taskId: params.taskId },
    }))
  );
}

interface NotifyConsolidationRequiredParams {
  taskId: string;
  taskTitle: string;
  leadUserIds: string[];
}

/** Notify lead department to submit consolidated report (hybrid mode). */
export async function notifyConsolidationRequired(
  params: NotifyConsolidationRequiredParams
): Promise<void> {
  await sendNotifications(
    params.leadUserIds.map((userId) => ({
      userId,
      type: "task_consolidation_required",
      title: "Consolidated Report Required",
      body: `All departments have submitted on "${params.taskTitle}". Please upload the consolidated report.`,
      metadata: { taskId: params.taskId },
    }))
  );
}

interface NotifyTaskClosedParams {
  taskId: string;
  taskTitle: string;
  recipientUserIds: string[];
  closedByName: string;
}

/** Notify all assignees when collector closes the task. */
export async function notifyTaskClosed(
  params: NotifyTaskClosedParams
): Promise<void> {
  await sendNotifications(
    params.recipientUserIds.map((userId) => ({
      userId,
      type: "task_closed",
      title: "Task Closed",
      body: `"${params.taskTitle}" has been closed by ${params.closedByName}.`,
      metadata: { taskId: params.taskId },
    }))
  );
}

/** Fetch collector/adm user IDs for district notifications. */
export async function getCollectorUserIds(): Promise<string[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, roles(slug)")
    .eq("is_active", true);

  if (error) {
    console.error("[getCollectorUserIds]", error.message);
    return [];
  }

  return (data ?? [])
    .filter((user) => {
      const roleRecord = user.roles;
      const role = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;
      const slug = role?.slug as string | undefined;
      return slug === "collector" || slug === "adm" || slug === "acp";
    })
    .map((user) => user.id as string);
}
