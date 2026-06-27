"use server";

import { revalidatePath } from "next/cache";

import {
  updateUserSchema,
  type UpdateUserInput,
} from "@/features/users/schemas/user-schema";
import { getRoleIdBySlug } from "@/features/users/services/get-users";
import { canManageUsers } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type UpdateUserResult =
  | { success: true }
  | { success: false; message: string };

export type UpdateUserFormState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function revalidateUserPaths(userId: string) {
  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${userId}`);
  revalidatePath("/dashboard");
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<UpdateUserResult> {
  try {
    const actor = await getSessionUser();
    if (!actor || !canManageUsers(actor.role)) {
      return { success: false, message: "You do not have permission to edit users." };
    }

    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid form data",
      };
    }

    const roleId = await getRoleIdBySlug(parsed.data.role);
    if (!roleId) {
      return { success: false, message: "Selected role is not configured." };
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("users")
      .update({
        name: parsed.data.name,
        email: parsed.data.email,
        mobile: parsed.data.mobile ?? null,
        designation: parsed.data.designation,
        employee_code: parsed.data.employeeCode ?? null,
        role_id: roleId,
        department_id: parsed.data.departmentId,
        section_id: parsed.data.sectionId,
        is_active: parsed.data.isActive,
      })
      .eq("id", userId);

    if (error) {
      return { success: false, message: error.message ?? "Failed to update user." };
    }

    await admin.auth.admin.updateUserById(userId, {
      email: parsed.data.email,
      user_metadata: { name: parsed.data.name },
    });

    revalidateUserPaths(userId);
    return { success: true };
  } catch (error) {
    console.error("[updateUser]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error updating user.",
    };
  }
}

export async function updateUserFormAction(
  _prev: UpdateUserFormState,
  formData: FormData
): Promise<UpdateUserFormState> {
  const userId = formData.get("userId") as string;

  const result = await updateUser(userId, {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    mobile: (formData.get("mobile") as string) ?? "",
    designation: formData.get("designation") as string,
    employeeCode: (formData.get("employeeCode") as string) ?? "",
    password: "",
    role: formData.get("role") as UpdateUserInput["role"],
    departmentId: (formData.get("departmentId") as string) ?? "",
    sectionId: (formData.get("sectionId") as string) ?? "",
    isActive:
      formData.get("isActive") === "on" ||
      formData.get("isActive") === "true",
  });

  if (!result.success) {
    return { message: result.message };
  }

  return {};
}
