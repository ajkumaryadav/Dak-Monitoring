import {
  createNotifications,
  type CreateNotificationInput,
} from "@/features/notifications/services/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

async function getDistrictAdminIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data: roles } = await supabase
    .from("roles")
    .select("id, slug")
    .in("slug", ["collector", "acp"]);

  if (!roles?.length) return [];

  const roleIds = roles.map((r) => r.id as string);
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .eq("is_active", true)
    .in("role_id", roleIds);

  return (users ?? []).map((u) => u.id as string);
}

async function sendUserNotifications(
  inputs: CreateNotificationInput[]
): Promise<void> {
  try {
    await createNotifications(inputs);
  } catch (error) {
    console.error("Notification failure:", error);
  }
}

export async function notifyUserCreated(params: {
  userName: string;
  userEmail: string;
  roleLabel: string;
  actorUserId: string;
  targetUserId: string;
}): Promise<void> {
  const adminIds = await getDistrictAdminIds();
  const recipientIds = [
    ...new Set([params.actorUserId, params.targetUserId, ...adminIds]),
  ];

  await sendUserNotifications(
    recipientIds.map((userId) => ({
      userId,
      type: "user_created",
      title: "User Account Created",
      body: `${params.userName} (${params.userEmail}) was created with role ${params.roleLabel}.`,
      metadata: { email: params.userEmail, role: params.roleLabel },
    }))
  );
}

export async function notifyPasswordReset(params: {
  userName: string;
  userEmail: string;
  targetUserId: string;
  actorUserId: string;
}): Promise<void> {
  await sendUserNotifications([
    {
      userId: params.targetUserId,
      type: "password_reset",
      title: "Password Reset",
      body: "Your account password was reset by an administrator.",
      metadata: { reset_by: params.actorUserId },
    },
    {
      userId: params.actorUserId,
      type: "password_reset",
      title: "Password Reset",
      body: `Password reset for ${params.userName} (${params.userEmail}).`,
      metadata: { target_user_id: params.targetUserId },
    },
  ]);
}

export async function notifyUserStatusChange(params: {
  userName: string;
  userEmail: string;
  targetUserId: string;
  actorUserId: string;
  enabled: boolean;
}): Promise<void> {
  const type = params.enabled ? "user_enabled" : "user_disabled";
  const title = params.enabled ? "Account Enabled" : "Account Disabled";

  await sendUserNotifications([
    {
      userId: params.targetUserId,
      type,
      title,
      body: params.enabled
        ? "Your account has been enabled. You may sign in again."
        : "Your account has been disabled. Contact the Collectorate office.",
      metadata: { email: params.userEmail },
    },
    {
      userId: params.actorUserId,
      type,
      title,
      body: `${params.userName} (${params.userEmail}) was ${params.enabled ? "enabled" : "disabled"}.`,
      metadata: { target_user_id: params.targetUserId },
    },
  ]);
}
