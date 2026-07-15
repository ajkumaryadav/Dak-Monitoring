"use server";

import { revalidatePath } from "next/cache";

import { createActivityLog } from "@/features/activity/services/activity-log";
import { canPermanentlyDeleteUser } from "@/features/system-admin/lib/permissions";
import { getUserById } from "@/features/users/services/get-users";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type DeleteUserResult =
  | { success: true }
  | { success: false; message: string };

/**
 * ACP only — permanently remove a user after verifying no active DAK assignment.
 * Collector can deactivate but not permanently delete.
 */
export async function permanentlyDeleteUser(
  userId: string,
  confirmation: string
): Promise<DeleteUserResult> {
  try {
    const actor = await getSessionUser();
    if (!actor || !canPermanentlyDeleteUser(actor.role)) {
      return {
        success: false,
        message: "Only ACP can permanently delete users.",
      };
    }

    if (confirmation.trim().toUpperCase() !== "DELETE") {
      return {
        success: false,
        message: 'Type DELETE to confirm permanent user deletion.',
      };
    }

    if (actor.id === userId) {
      return { success: false, message: "You cannot delete your own account." };
    }

    const target = await getUserById(userId);
    if (!target) {
      return { success: false, message: "User not found." };
    }

    const admin = createAdminClient();

    const { count } = await admin
      .from("dak_entries")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", userId)
      .is("deleted_at", null)
      .not("status", "in", "(closed,completed,disposed)");

    if ((count ?? 0) > 0) {
      return {
        success: false,
        message: `User still has ${count} active assigned DAK. Reassign before permanent delete.`,
      };
    }

    const { error: profileError } = await admin
      .from("users")
      .delete()
      .eq("id", userId);

    if (profileError) {
      return {
        success: false,
        message: profileError.message ?? "Failed to delete user profile.",
      };
    }

    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("[permanentlyDeleteUser] auth", authError.message);
    }

    await createActivityLog({
      userId: actor.id,
      action: "User Permanent Delete",
      module: "users",
      description: `Permanently deleted user ${target.name}`,
      metadata: { target_user_id: userId, target_email: target.email },
    });

    revalidatePath("/dashboard/admin/users");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[permanentlyDeleteUser]", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unexpected delete failure.",
    };
  }
}

export async function permanentlyDeleteUserAction(
  userId: string,
  confirmation: string
) {
  return permanentlyDeleteUser(userId, confirmation);
}
