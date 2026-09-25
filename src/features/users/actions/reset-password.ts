"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { notifyPasswordReset } from "@/features/users/services/notify-user-event";
import { createActivityLog } from "@/features/activity/services/activity-log";
import { getUserById } from "@/features/users/services/get-users";
import { canManageUsers } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import { formatSafeErrorMessage, logSafeError } from "@/lib/security/errors";
import { revokeAllUserSessions } from "@/lib/auth/session-store";

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

    const validId = z.string().uuid().safeParse(userId);
    if (!validId.success) {
      return { success: false, message: "Invalid user ID." };
    }

    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      return { success: false, message: "Password must be between 8 and 128 characters." };
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
      return { success: false, message: formatSafeErrorMessage(error, "Failed to reset password.") };
    }

    // Revoke old sessions after password reset
    await revokeAllUserSessions(userId);

    await notifyPasswordReset({
      userName: target.name,
      userEmail: target.email,
      targetUserId: userId,
      actorUserId: actor.id,
    });

    await createActivityLog({
      userId: actor.id,
      action: "Password Reset",
      module: "users",
      description: `Reset password for ${target.name}`,
      metadata: { target_user_id: userId },
    });

    revalidatePath("/dashboard/admin/users");
    revalidatePath(`/dashboard/admin/users/${userId}`);
    return { success: true };
  } catch (error: unknown) {
    logSafeError("resetUserPassword", error);
    return {
      success: false,
      message: formatSafeErrorMessage(error, "Unexpected error resetting password."),
    };
  }
}

export async function resetPasswordFormAction(
  _prev: { message?: string },
  formData: FormData
): Promise<{ message?: string; success?: boolean }> {
  try {
    const userId = formData.get("userId") as string;
    const password = formData.get("password") as string;
    const result = await resetUserPassword(userId, password);

    if (!result.success) {
      return { message: result.message };
    }

    return { success: true, message: "Password reset successfully." };
  } catch (err: unknown) {
    logSafeError("resetPasswordFormAction", err);
    return { message: formatSafeErrorMessage(err, "Failed to reset password.") };
  }
}
