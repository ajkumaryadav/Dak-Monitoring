"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isValidDisposalDueDate } from "@/lib/constants/priority-due-date";
import { canManageTasks, PERMISSIONS, hasPermission } from "@/lib/auth";
import { uploadDakFile } from "@/features/dak/actions/upload-attachment";
import {
  sanitizeFileName,
  validateAttachmentFile,
} from "@/features/dak/lib/attachment-validation";
import {
  getCollectorUserIds,
  notifyAssigneeCompleted,
  notifyConsolidationRequired,
  notifyTaskAssigned,
  notifyTaskClosed,
} from "@/features/notifications/services/notify-task-event";
import {
  type TaskAssignmentMode,
} from "@/features/tasks/lib/task-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

const createTaskSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().optional(),
  category: z.enum([
    "meeting",
    "inspection",
    "election",
    "disaster",
    "campaign",
    "law_order",
    "general",
  ]),
  assignmentMode: z.enum(["parallel", "sequential", "hybrid"]),
  leadDepartmentId: z.string().uuid().optional().or(z.literal("")),
  assigneeIds: z
    .string()
    .min(1)
    .transform((value) =>
      [...new Set(value.split(",").map((id) => id.trim()).filter(Boolean))]
    )
    .pipe(z.array(z.string().uuid()).min(1, "Select at least one assignee")),
  priority: z.enum(["routine", "important", "urgent", "immediate"]),
  dueDate: z
    .string()
    .min(1, "Due date is required")
    .refine((value) => isValidDisposalDueDate(value.slice(0, 10)), {
      message: "Due date must be on or after today",
    }),
  remarks: z.string().max(500).optional(),
});

export async function createTaskFormAction(
  _prev: { message?: string },
  formData: FormData
) {
  const user = await getSessionUser();
  if (!user || !canManageTasks(user.role)) {
    return { message: "Unauthorized." };
  }

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    assignmentMode: formData.get("assignmentMode"),
    leadDepartmentId: formData.get("leadDepartmentId") ?? "",
    assigneeIds: formData.get("assigneeIds"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    remarks: formData.get("remarks") ?? "",
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const {
    title,
    description,
    category,
    assignmentMode,
    leadDepartmentId,
    assigneeIds,
    priority,
    dueDate,
    remarks,
  } = parsed.data;

  if (assignmentMode === "hybrid" && !leadDepartmentId) {
    return { message: "Select a lead department for hybrid assignment." };
  }

  const supabase = createAdminClient();

  const { data: officers, error: officersError } = await supabase
    .from("users")
    .select("id, department_id")
    .in("id", assigneeIds);

  if (officersError || !officers?.length) {
    return { message: "Invalid assignee selection." };
  }

  const officerMap = new Map(
    officers.map((o) => [o.id as string, o.department_id as string | null])
  );

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title,
      description: description || null,
      category,
      assignment_mode: assignmentMode,
      lead_department_id: leadDepartmentId || null,
      assigned_by: user.id,
      priority,
      due_date: dueDate.slice(0, 10),
      status: "assigned",
      remarks: remarks || null,
    })
    .select("id")
    .single();

  if (taskError || !task) {
    return { message: taskError?.message ?? "Failed to create task" };
  }

  const now = new Date().toISOString();
  const assigneeRows = assigneeIds.map((officerId, index) => {
    const deptId = officerMap.get(officerId) ?? null;
    const isLead =
      assignmentMode === "hybrid" &&
      !!leadDepartmentId &&
      deptId === leadDepartmentId;

    let isActive = true;
    let status: string = "assigned";

    if (assignmentMode === "sequential") {
      isActive = index === 0;
      status = index === 0 ? "assigned" : "pending";
    }

    return {
      task_id: task.id,
      department_id: deptId,
      assigned_to: officerId,
      is_lead: isLead,
      sequence_order: index,
      is_active: isActive,
      status,
      activated_at: isActive ? now : null,
    };
  });

  const { error: assigneeError } = await supabase
    .from("task_assignees")
    .insert(assigneeRows);

  if (assigneeError) {
    await supabase.from("tasks").delete().eq("id", task.id);
    return { message: assigneeError.message };
  }

  await supabase.from("task_timeline").insert({
    task_id: task.id,
    user_id: user.id,
    action: "Task Created",
    remarks: `${assigneeIds.length} assignee(s) · ${assignmentMode} mode`,
  });

  const notifyIds =
    assignmentMode === "sequential"
      ? [assigneeIds[0]]
      : assigneeIds;

  await notifyTaskAssigned({
    taskId: task.id as string,
    taskTitle: title,
    recipientUserIds: notifyIds,
    assignedByName: user.name,
    dueDate: dueDate.slice(0, 10),
  });

  revalidatePath("/dashboard/tasks");
  redirect(`/dashboard/tasks/${task.id}`);
}

const updateAssigneeStatusSchema = z.object({
  assigneeId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: z.enum(["accepted", "in_progress"]),
});

export async function updateAssigneeStatusFormAction(
  _prev: { message?: string },
  formData: FormData
) {
  const user = await getSessionUser();
  if (!user || !hasPermission(user.role, PERMISSIONS.TASKS)) {
    return { message: "Unauthorized." };
  }

  const parsed = updateAssigneeStatusSchema.safeParse({
    assigneeId: formData.get("assigneeId"),
    taskId: formData.get("taskId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const supabase = createAdminClient();
  const { data: assignee, error: fetchError } = await supabase
    .from("task_assignees")
    .select("id, assigned_to, is_active, status")
    .eq("id", parsed.data.assigneeId)
    .eq("task_id", parsed.data.taskId)
    .maybeSingle();

  if (fetchError || !assignee) {
    return { message: "Assignment not found." };
  }

  if (assignee.assigned_to !== user.id) {
    return { message: "Unauthorized." };
  }

  if (!assignee.is_active) {
    return { message: "This assignment is not yet active." };
  }

  const { error } = await supabase
    .from("task_assignees")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.assigneeId);

  if (error) {
    return { message: error.message };
  }

  await supabase.from("task_timeline").insert({
    task_id: parsed.data.taskId,
    assignee_id: parsed.data.assigneeId,
    user_id: user.id,
    action: `Status: ${parsed.data.status.replace(/_/g, " ")}`,
  });

  revalidatePath(`/dashboard/tasks/${parsed.data.taskId}`);
  return {};
}

const complianceSchema = z.object({
  taskId: z.string().uuid(),
  assigneeId: z.string().uuid(),
  complianceText: z.string().trim().min(10),
});

export async function submitTaskComplianceFormAction(
  _prev: { message?: string },
  formData: FormData
) {
  const user = await getSessionUser();
  if (!user || !hasPermission(user.role, PERMISSIONS.TASKS)) {
    return { message: "Unauthorized." };
  }

  const parsed = complianceSchema.safeParse({
    taskId: formData.get("taskId"),
    assigneeId: formData.get("assigneeId"),
    complianceText: formData.get("complianceText"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid compliance" };
  }

  const supabase = createAdminClient();
  const { data: assignee, error: fetchError } = await supabase
    .from("task_assignees")
    .select(
      "id, assigned_to, is_active, status, sequence_order, task_id, tasks(title, assignment_mode, lead_department_id, status)"
    )
    .eq("id", parsed.data.assigneeId)
    .eq("task_id", parsed.data.taskId)
    .maybeSingle();

  if (fetchError || !assignee) {
    return { message: "Assignment not found." };
  }

  if (assignee.assigned_to !== user.id) {
    return { message: "Unauthorized." };
  }

  if (!assignee.is_active) {
    return { message: "This assignment is not yet active." };
  }

  const attachment = formData.get("attachment");
  const file =
    attachment instanceof File && attachment.size > 0 ? attachment : null;

  let attachmentPath: string | null = null;

  if (file) {
    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      return { message: validation.message };
    }

    const upload = await uploadDakFile(
      `tasks/${parsed.data.taskId}/${parsed.data.assigneeId}`,
      file
    );
    if (!upload.success) {
      return { message: upload.message };
    }
    attachmentPath = upload.filePath;
  }

  const now = new Date().toISOString();

  await supabase.from("task_compliance").insert({
    task_id: parsed.data.taskId,
    assignee_id: parsed.data.assigneeId,
    submitted_by: user.id,
    compliance_text: parsed.data.complianceText,
    attachment_path: attachmentPath,
  });

  await supabase
    .from("task_assignees")
    .update({
      status: "completed",
      action_summary: parsed.data.complianceText,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", parsed.data.assigneeId);

  const attachmentNote = file
    ? ` · Attachment: ${sanitizeFileName(file.name)}`
    : "";

  await supabase.from("task_timeline").insert({
    task_id: parsed.data.taskId,
    assignee_id: parsed.data.assigneeId,
    user_id: user.id,
    action: "Action Taken / ATR Submitted",
    remarks: `${parsed.data.complianceText.slice(0, 180)}${attachmentNote}`,
  });

  const taskRecord = assignee.tasks;
  const taskData = Array.isArray(taskRecord) ? taskRecord[0] : taskRecord;
  const taskTitle = (taskData as { title?: string })?.title ?? "Task";
  const assignmentMode = (taskData as { assignment_mode?: TaskAssignmentMode })
    ?.assignment_mode;

  const collectorIds = await getCollectorUserIds();
  await notifyAssigneeCompleted({
    taskId: parsed.data.taskId,
    taskTitle,
    assigneeName: user.name,
    collectorUserIds: collectorIds,
  });

  if (assignmentMode === "sequential") {
    const { data: nextAssignee } = await supabase
      .from("task_assignees")
      .select("id, assigned_to")
      .eq("task_id", parsed.data.taskId)
      .eq("sequence_order", (assignee.sequence_order as number) + 1)
      .maybeSingle();

    if (nextAssignee) {
      await supabase
        .from("task_assignees")
        .update({
          is_active: true,
          status: "assigned",
          activated_at: now,
          updated_at: now,
        })
        .eq("id", nextAssignee.id);

      await supabase.from("task_timeline").insert({
        task_id: parsed.data.taskId,
        assignee_id: nextAssignee.id,
        user_id: user.id,
        action: "Sequential Assignment Activated",
        remarks: "Next department in chain has received the task.",
      });

      await notifyTaskAssigned({
        taskId: parsed.data.taskId,
        taskTitle,
        recipientUserIds: [nextAssignee.assigned_to as string],
        assignedByName: user.name,
      });
    }
  }

  await maybeAdvanceMasterTaskStatus(parsed.data.taskId);

  revalidatePath(`/dashboard/tasks/${parsed.data.taskId}`);
  revalidatePath("/dashboard/tasks");
  return {};
}

const consolidatedReportSchema = z.object({
  taskId: z.string().uuid(),
  reportText: z.string().trim().min(10),
});

export async function submitConsolidatedReportFormAction(
  _prev: { message?: string },
  formData: FormData
) {
  const user = await getSessionUser();
  if (!user || !hasPermission(user.role, PERMISSIONS.TASKS)) {
    return { message: "Unauthorized." };
  }

  const parsed = consolidatedReportSchema.safeParse({
    taskId: formData.get("taskId"),
    reportText: formData.get("reportText"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid report" };
  }

  const supabase = createAdminClient();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, assignment_mode, lead_department_id, status")
    .eq("id", parsed.data.taskId)
    .maybeSingle();

  if (taskError || !task) {
    return { message: "Task not found." };
  }

  if (task.assignment_mode !== "hybrid") {
    return { message: "Consolidated report is only for hybrid tasks." };
  }

  const { data: leadAssignee } = await supabase
    .from("task_assignees")
    .select("id")
    .eq("task_id", parsed.data.taskId)
    .eq("assigned_to", user.id)
    .eq("is_lead", true)
    .maybeSingle();

  if (!leadAssignee) {
    return { message: "Only the lead department officer can submit the consolidated report." };
  }

  const attachment = formData.get("attachment");
  const file =
    attachment instanceof File && attachment.size > 0 ? attachment : null;

  let reportPath: string | null = null;

  if (file) {
    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      return { message: validation.message };
    }

    const upload = await uploadDakFile(
      `tasks/${parsed.data.taskId}/consolidated`,
      file
    );
    if (!upload.success) {
      return { message: upload.message };
    }
    reportPath = upload.filePath;
  }

  const now = new Date().toISOString();

  await supabase
    .from("tasks")
    .update({
      consolidated_report_text: parsed.data.reportText,
      consolidated_report_path: reportPath,
      consolidated_report_by: user.id,
      consolidated_report_at: now,
      status: "assigned",
      updated_at: now,
    })
    .eq("id", parsed.data.taskId);

  await supabase.from("task_timeline").insert({
    task_id: parsed.data.taskId,
    user_id: user.id,
    action: "Consolidated Report Submitted",
    remarks: parsed.data.reportText.slice(0, 200),
  });

  revalidatePath(`/dashboard/tasks/${parsed.data.taskId}`);
  return {};
}

const closeTaskSchema = z.object({
  taskId: z.string().uuid(),
  remarks: z.string().max(500).optional(),
});

export async function closeTaskFormAction(
  _prev: { message?: string },
  formData: FormData
) {
  const user = await getSessionUser();
  if (!user || !canManageTasks(user.role)) {
    return { message: "Unauthorized." };
  }

  const parsed = closeTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    remarks: formData.get("remarks") ?? "",
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const supabase = createAdminClient();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, status")
    .eq("id", parsed.data.taskId)
    .maybeSingle();

  if (taskError || !task) {
    return { message: "Task not found." };
  }

  if (task.status === "closed") {
    return { message: "Task is already closed." };
  }

  const now = new Date().toISOString();

  await supabase
    .from("tasks")
    .update({
      status: "closed",
      closed_at: now,
      updated_at: now,
    })
    .eq("id", parsed.data.taskId);

  await supabase.from("task_timeline").insert({
    task_id: parsed.data.taskId,
    user_id: user.id,
    action: "Task Closed by Collector",
    remarks: parsed.data.remarks || null,
  });

  const { data: assignees } = await supabase
    .from("task_assignees")
    .select("assigned_to")
    .eq("task_id", parsed.data.taskId);

  const recipientIds = (assignees ?? []).map((a) => a.assigned_to as string);

  await notifyTaskClosed({
    taskId: parsed.data.taskId,
    taskTitle: task.title as string,
    recipientUserIds: recipientIds,
    closedByName: user.name,
  });

  revalidatePath(`/dashboard/tasks/${parsed.data.taskId}`);
  revalidatePath("/dashboard/tasks");
  return {};
}

/** Advance master task when all assignees complete (hybrid → awaiting consolidation). */
async function maybeAdvanceMasterTaskStatus(taskId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, assignment_mode, status")
    .eq("id", taskId)
    .maybeSingle();

  if (!task || task.status === "closed") return;

  const { data: assignees } = await supabase
    .from("task_assignees")
    .select("id, status, is_lead, assigned_to")
    .eq("task_id", taskId);

  if (!assignees?.length) return;

  const allCompleted = assignees.every((a) => a.status === "completed");
  if (!allCompleted) return;

  if (task.assignment_mode === "hybrid") {
    const { data: existing } = await supabase
      .from("tasks")
      .select("consolidated_report_text")
      .eq("id", taskId)
      .maybeSingle();

    if (!existing?.consolidated_report_text) {
      await supabase
        .from("tasks")
        .update({
          status: "awaiting_consolidation",
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      const leadUserIds = assignees
        .filter((a) => a.is_lead)
        .map((a) => a.assigned_to as string);

      if (leadUserIds.length) {
        await notifyConsolidationRequired({
          taskId,
          taskTitle: task.title as string,
          leadUserIds,
        });
      }
    }
  }
}
