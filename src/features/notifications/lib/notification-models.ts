import type { NotificationType } from "@/features/notifications/lib/notification-types";
import { COLLECTOR_DASHBOARD_ROLES } from "@/lib/auth/permissions";
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

/** Map a notifications table row to app record. */
export function mapNotificationRow(row: Record<string, unknown>): NotificationRecord {
  const content =
    (row.body as string | null | undefined) ??
    (row.message as string | null | undefined) ??
    "";

  const readAtStr =
    row.read_at instanceof Date
      ? row.read_at.toISOString()
      : (row.read_at as string | null) ?? null;

  const createdAtStr =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at || new Date().toISOString());

  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as NotificationType,
    title: row.title as string,
    body: content,
    dakId: (row.dak_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    readAt: readAtStr,
    createdAt: createdAtStr,
  };
}

/** Collector, ACP, and ADM see district-wide notifications. */
export function canViewAllNotifications(user: SessionUser): boolean {
  return COLLECTOR_DASHBOARD_ROLES.includes(user.role);
}
