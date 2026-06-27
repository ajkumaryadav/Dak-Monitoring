"use server";

import { revalidatePath } from "next/cache";

import { notifyPasswordReset } from "@/features/users/services/notify-user-event";
import { getUserById } from "@/features/users/services/get-users";
import { canManageUsers } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type ResetPasswordResult =
  | { success: true }
  | { success: false; message: string };

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  try {
    const actor = await getSessionUser();
    if (!actor || !canManageUsers(actor.role)) {
      return { success: false, message: "You do not have permission to reset passwords." };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters." };
    }

    const target = await getUserById(userId);
    if (!target) {
      return { success: false, message: "User not found." };
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return { success: false, message: error.message ?? "Failed to reset password." };
    }

    await notifyPasswordReset({
      userName: target.name,
      userEmail: target.email,
      targetUserId: userId,
      actorUserId: actor.id,
    });

    revalidatePath("/dashboard/admin/users");
    revalidatePath(`/dashboard/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("[resetUserPassword]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error resetting password.",
    };
  }
}

export async function resetPasswordFormAction(
  _prev: { message?: string },
  formData: FormData
): Promise<{ message?: string; success?: boolean }> {
  const userId = formData.get("userId") as string;
  const password = formData.get("password") as string;
  const result = await resetUserPassword(userId, password);

  if (!result.success) {
    return { message: result.message };
  }

  return { success: true, message: "Password reset successfully." };
}
