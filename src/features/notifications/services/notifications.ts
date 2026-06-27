import type { NotificationType } from "@/features/notifications/lib/notification-types";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/types";

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  dakId: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  dakNumber?: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  dakId?: string;
  metadata?: Record<string, unknown>;
}

export interface GetNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
}

const NOTIFICATION_SELECT = `
  id,
  user_id,
  type,
  title,
  body,
  message,
  dak_id,
  metadata,
  read_at,
  created_at
`;

let notificationsTableMissingLogged = false;

function isMissingNotificationsTable(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("notifications") ||
    message.includes("schema cache")
  );
}

function logNotificationsTableMissing(context: string): void {
  if (notificationsTableMissingLogged) return;
  notificationsTableMissingLogged = true;
  console.warn(
    `[${context}] notifications table is not available. Run supabase/migrations/000011_notifications.sql in the Supabase SQL Editor.`
  );
}

function logNotificationError(
  context: string,
  error: { message?: string; code?: string }
): void {
  if (isMissingNotificationsTable(error)) {
    logNotificationsTableMissing(context);
    return;
  }
  console.error(`[${context}]`, error.message ?? error);
}

function mapNotificationRow(row: Record<string, unknown>): NotificationRecord {
  const content =
    (row.body as string | null | undefined) ??
    (row.message as string | null | undefined) ??
    "";

  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as NotificationType,
    title: row.title as string,
    body: content,
    dakId: (row.dak_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    readAt: (row.read_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/** Map app payload to DB row — supports legacy `message` column. */
function toNotificationInsertRow(input: CreateNotificationInput) {
  return {
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    message: input.body,
    dak_id: input.dakId ?? null,
    metadata: input.metadata ?? {},
  };
}

async function attachDakNumbers(
  records: NotificationRecord[]
): Promise<NotificationRecord[]> {
  const dakIds = [
    ...new Set(records.map((record) => record.dakId).filter(Boolean)),
  ] as string[];

  if (!dakIds.length) {
    return records;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dak_entries")
    .select("id, dak_number")
    .in("id", dakIds);

  if (error) {
    logNotificationError("attachDakNumbers", error);
    return records;
  }

  const dakNumbers = new Map(
    (data ?? []).map((row) => [row.id as string, row.dak_number as string])
  );

  return records.map((record) =>
    record.dakId
      ? { ...record, dakNumber: dakNumbers.get(record.dakId) }
      : record
  );
}

/** Collector, ACP, and ADM see district-wide notifications. */
export function canViewAllNotifications(user: SessionUser): boolean {
  return (
    hasPermission(user.role, PERMISSIONS.ALL) ||
    user.role === "adm"
  );
}

/** Insert a notification row (realtime-ready via postgres_changes on notifications). */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ success: boolean; id: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert(toNotificationInsertRow(input))
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, id: data.id as string };
}

/** Batch insert notifications for multiple recipients. */
export async function createNotifications(
  inputs: CreateNotificationInput[]
): Promise<{ inserted: number }> {
  if (!inputs.length) {
    return { inserted: 0 };
  }

  const recipientIds = [...new Set(inputs.map((input) => input.userId))];
  if (!recipientIds.length) {
    throw new Error("No notification recipients.");
  }

  const supabase = createAdminClient();
  const rows = inputs.map(toNotificationInsertRow);

  // Probe insert — validates schema/connectivity before batch.
  const { error: probeError } = await supabase
    .from("notifications")
    .insert(rows[0])
    .select("id")
    .single();

  if (probeError) {
    throw new Error(probeError.message);
  }

  let inserted = 1;

  if (rows.length > 1) {
    const { data, error } = await supabase
      .from("notifications")
      .insert(rows.slice(1))
      .select("id");

    if (error) {
      throw new Error(error.message);
    }

    inserted += data?.length ?? 0;
  }

  console.info(`[createNotifications] Inserted ${inserted} notification(s).`);
  return { inserted };
}

/** Fetch notifications — collector/adm see all; others see own only. */
export async function getUserNotifications(
  user: SessionUser,
  options: GetNotificationsOptions = {}
): Promise<NotificationRecord[]> {
  const supabase = createAdminClient();
  const limit = options.limit ?? 50;

  let query = supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!canViewAllNotifications(user)) {
    query = query.eq("user_id", user.id);
  }

  if (options.unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;

  if (error) {
    logNotificationError("getUserNotifications", error);
    return [];
  }

  const records = (data ?? []).map((row) =>
    mapNotificationRow(row as Record<string, unknown>)
  );

  return attachDakNumbers(records);
}

/** Count unread notifications for header badge. */
export async function getUnreadNotificationCount(
  user: SessionUser
): Promise<number> {
  const supabase = createAdminClient();

  let query = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (!canViewAllNotifications(user)) {
    query = query.eq("user_id", user.id);
  }

  const { count, error } = await query;

  if (error) {
    logNotificationError("getUnreadNotificationCount", error);
    return 0;
  }

  return count ?? 0;
}

/** Mark a single notification as read (RBAC enforced). */
export async function markAsRead(
  user: SessionUser,
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();

  let verifyQuery = supabase
    .from("notifications")
    .select("id, user_id")
    .eq("id", notificationId)
    .maybeSingle();

  const { data: existing, error: fetchError } = await verifyQuery;

  if (fetchError || !existing) {
    return { success: false, message: "Notification not found." };
  }

  if (
    !canViewAllNotifications(user) &&
    existing.user_id !== user.id
  ) {
    return { success: false, message: "You cannot update this notification." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    logNotificationError("markAsRead", error);
    return { success: false, message: error.message ?? "Failed to mark as read." };
  }

  return { success: true };
}

/** Mark all visible notifications as read for the current user scope. */
export async function markAllRead(
  user: SessionUser
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  const readAt = new Date().toISOString();

  let query = supabase
    .from("notifications")
    .update({ read_at: readAt })
    .is("read_at", null);

  if (!canViewAllNotifications(user)) {
    query = query.eq("user_id", user.id);
  }

  const { error } = await query;

  if (error) {
    logNotificationError("markAllRead", error);
    return { success: false, message: error.message ?? "Failed to mark all as read." };
  }

  return { success: true };
}

/** Check if an overdue alert was already sent recently (dedup). */
export async function hasRecentOverdueNotification(
  userId: string,
  dakId: string,
  withinHours = 24
): Promise<boolean> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("dak_id", dakId)
    .eq("type", "dak_overdue")
    .gte("created_at", since)
    .limit(1);

  if (error) {
    logNotificationError("hasRecentOverdueNotification", error);
    // Allow retry when schema/enum is incomplete — do not block overdue sync.
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Future realtime hook:
 * supabase.channel(NOTIFICATIONS_REALTIME_CHANNEL)
 *   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, handler)
 *   .subscribe()
 */
