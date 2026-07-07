"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { canManageTasks, PERMISSIONS, hasPermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

const createTaskSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().optional(),
  departmentId: z.string().uuid(),
  assignedTo: z.string().uuid(),
  priority: z.enum(["routine", "important", "urgent", "immediate"]),
  dueDate: z.string().min(1),
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
    departmentId: formData.get("departmentId"),
    assignedTo: formData.get("assignedTo"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
    remarks: formData.get("remarks") ?? "",
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      department_id: parsed.data.departmentId,
      assigned_to: parsed.data.assignedTo,
      assigned_by: user.id,
      priority: parsed.data.priority,
      due_date: parsed.data.dueDate.slice(0, 10),
      status: "assigned",
      remarks: parsed.data.remarks || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { message: error?.message ?? "Failed to create task" };
  }

  await supabase.from("task_timeline").insert({
    task_id: data.id,
    user_id: user.id,
    action: "Task Assigned",
    remarks: parsed.data.remarks || parsed.data.title,
  });

  revalidatePath("/dashboard/tasks");
  redirect(`/dashboard/tasks/${data.id}`);
}

const updateTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum([
    "accepted",
    "in_progress",
    "compliance_submitted",
    "approved",
    "closed",
  ]),
  remarks: z.string().max(500).optional(),
});

export async function updateTaskStatusFormAction(
  _prev: { message?: string },
  formData: FormData
) {
  const user = await getSessionUser();
  if (!user || !hasPermission(user.role, PERMISSIONS.TASKS)) {
    return { message: "Unauthorized." };
  }

  const parsed = updateTaskStatusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    remarks: formData.get("remarks") ?? "",
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const isApprovalAction =
    parsed.data.status === "approved" || parsed.data.status === "closed";
  if (isApprovalAction && user && !canManageTasks(user.role)) {
    return { message: "Unauthorized." };
  }

  const supabase = createAdminClient();
  const update: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.status === "closed" || parsed.data.status === "approved") {
    update.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", parsed.data.taskId);

  if (error) {
    return { message: error.message };
  }

  await supabase.from("task_timeline").insert({
    task_id: parsed.data.taskId,
    user_id: user.id,
    action: `Status: ${parsed.data.status}`,
    remarks: parsed.data.remarks || null,
  });

  revalidatePath(`/dashboard/tasks/${parsed.data.taskId}`);
  revalidatePath("/dashboard/tasks");
  return {};
}

const complianceSchema = z.object({
  taskId: z.string().uuid(),
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
    complianceText: formData.get("complianceText"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid compliance" };
  }

  const supabase = createAdminClient();
  await supabase.from("task_compliance").insert({
    task_id: parsed.data.taskId,
    submitted_by: user.id,
    compliance_text: parsed.data.complianceText,
  });

  await supabase
    .from("tasks")
    .update({ status: "compliance_submitted", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.taskId);

  await supabase.from("task_timeline").insert({
    task_id: parsed.data.taskId,
    user_id: user.id,
    action: "Compliance Submitted",
    remarks: parsed.data.complianceText.slice(0, 200),
  });

  revalidatePath(`/dashboard/tasks/${parsed.data.taskId}`);
  return {};
}
