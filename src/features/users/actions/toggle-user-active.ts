"use server";

import { revalidatePath } from "next/cache";

import { notifyUserStatusChange } from "@/features/users/services/notify-user-event";
import { getUserById } from "@/features/users/services/get-users";
import { canManageUsers } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

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
      return { success: false, message: error.message ?? "Failed to update user status." };
    }

    if (!isActive) {
      await admin.auth.admin.signOut(userId, "global");
    }

    await notifyUserStatusChange({
      userName: target.name,
      userEmail: target.email,
      targetUserId: userId,
      actorUserId: actor.id,
      enabled: isActive,
    });

    revalidatePath("/dashboard/admin/users");
    revalidatePath(`/dashboard/admin/users/${userId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[setUserActive]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error updating status.",
    };
  }
}

export async function toggleUserActiveAction(
  userId: string,
  isActive: boolean
) {
  return setUserActive(userId, isActive);
}
