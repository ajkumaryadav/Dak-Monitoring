"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getRoleLabel } from "@/features/users/lib/role-labels";
import { createActivityLog } from "@/features/activity/services/activity-log";
import {
  createUserSchema,
  type CreateUserInput,
} from "@/features/users/schemas/user-schema";
import { getRoleIdBySlug } from "@/features/users/services/get-users";
import { notifyUserCreated } from "@/features/users/services/notify-user-event";
import { canManageUsers } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type CreateUserResult =
  | { success: true; userId: string }
  | { success: false; message: string };

export type CreateUserFormState = {
  message?: string;
  success?: boolean;
  errors?: Record<string, string[]>;
};

function revalidateUserPaths(userId?: string) {
  revalidatePath("/dashboard/admin/users");
  if (userId) revalidatePath(`/dashboard/admin/users/${userId}`);
  revalidatePath("/dashboard");
}

/** Create auth user + public.users profile — Collector/ACP only. */
export async function createUser(
  input: CreateUserInput
): Promise<CreateUserResult> {
  try {
    const actor = await getSessionUser();
    if (!actor || !canManageUsers(actor.role)) {
      return { success: false, message: "You do not have permission to create users." };
    }

    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid form data",
      };
    }

    const roleId = await getRoleIdBySlug(parsed.data.role);
    if (!roleId) {
      return { success: false, message: "Selected role is not configured in the database." };
    }

    const admin = createAdminClient();

    const { data: authUser, error: authError } =
      await admin.auth.admin.createUser({
        email: parsed.data.email,
        password: parsed.data.password!,
        email_confirm: true,
        user_metadata: { name: parsed.data.name },
      });

    if (authError || !authUser.user) {
      return {
        success: false,
        message: authError?.message ?? "Failed to create auth user.",
      };
    }

    const { error: profileError } = await admin.from("users").upsert(
      {
        id: authUser.user.id,
        email: parsed.data.email,
        name: parsed.data.name,
        mobile: parsed.data.mobile ?? null,
        designation: parsed.data.designation,
        employee_code: parsed.data.employeeCode ?? null,
        role_id: roleId,
        department_id: parsed.data.departmentId,
        section_id: parsed.data.sectionId,
        is_active: parsed.data.isActive,
        created_by: actor.id,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      return {
        success: false,
        message: profileError.message ?? "Failed to save user profile.",
      };
    }

    await notifyUserCreated({
      userName: parsed.data.name,
      userEmail: parsed.data.email,
      roleLabel: getRoleLabel(parsed.data.role),
      actorUserId: actor.id,
      targetUserId: authUser.user.id,
    });

    await createActivityLog({
      userId: actor.id,
      action: "User Creation",
      module: "users",
      description: `Created user ${parsed.data.name} (${parsed.data.email})`,
      metadata: {
        target_user_id: authUser.user.id,
        role: parsed.data.role,
      },
    });

    revalidateUserPaths(authUser.user.id);
    return { success: true, userId: authUser.user.id };
  } catch (error) {
    console.error("[createUser]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error creating user.",
    };
  }
}

export async function createUserFormAction(
  _prev: CreateUserFormState,
  formData: FormData
): Promise<CreateUserFormState> {
  const result = await createUser({
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    mobile: (formData.get("mobile") as string) ?? "",
    designation: formData.get("designation") as string,
    employeeCode: (formData.get("employeeCode") as string) ?? "",
    password: formData.get("password") as string,
    role: formData.get("role") as CreateUserInput["role"],
    departmentId: (formData.get("departmentId") as string) ?? "",
    sectionId: (formData.get("sectionId") as string) ?? "",
    isActive:
      formData.get("isActive") === "on" ||
      formData.get("isActive") === "true",
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  redirect("/dashboard/admin/users?created=1");
}
