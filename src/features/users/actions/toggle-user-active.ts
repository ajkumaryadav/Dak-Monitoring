"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { notifyUserStatusChange } from "@/features/users/services/notify-user-event";
import { createActivityLog } from "@/features/activity/services/activity-log";
import { getUserById } from "@/features/users/services/get-users";
import { canManageUsers } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";
import { formatSafeErrorMessage, logSafeError } from "@/lib/security/errors";
import { revokeAllUserSessions } from "@/lib/auth/session-store";

export type ToggleUserActiveResult =
  | { success: true }
  | { success: false; message: string };

export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<ToggleUserActiveResult> {
  try {
    const actor = await getSessionUser();
    if (!actor || !canManageUsers(actor.role)) {
      return { success: false, message: "You do not have permission to change user status." };
    }

    const validId = z.string().uuid().safeParse(userId);
    if (!validId.success) {
      return { success: false, message: "Invalid user ID." };
    }

    if (actor.id === userId && !isActive) {
      return { success: false, message: "You cannot disable your own account." };
    }

    const target = await getUserById(userId);
    if (!target) {
      return { success: false, message: "User not found." };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("users")
      .update({ is_active: isActive })
      .eq("id", userId);

    if (error) {
      return { success: false, message: formatSafeErrorMessage(error, "Failed to update user status.") };
    }

    if (!isActive) {
      // Invalidate all active sessions for deactivated user
      await revokeAllUserSessions(userId);
      await admin.auth.admin.signOut(userId, "global");
    }

    await notifyUserStatusChange({
      userName: target.name,
      userEmail: target.email,
      targetUserId: userId,
      actorUserId: actor.id,
      enabled: isActive,
    });

    if (!isActive) {
      await createActivityLog({
        userId: actor.id,
        action: "User Disable",
        module: "users",
        description: `Disabled user ${target.name}`,
        metadata: { target_user_id: userId },
      });
    }

    revalidateUserPaths(userId);
    return { success: true };
  } catch (error: unknown) {
    logSafeError("setUserActive", error);
    return {
      success: false,
      message: formatSafeErrorMessage(error, "Unexpected error updating status."),
    };
  }
}

function revalidateUserPaths(userId: string) {
  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${userId}`);
  revalidatePath("/dashboard");
}

export async function toggleUserActiveAction(
  userId: string,
  isActive: boolean
) {
  return setUserActive(userId, isActive);
}
