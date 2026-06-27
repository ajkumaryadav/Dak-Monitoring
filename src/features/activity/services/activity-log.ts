import { canViewActivityLog } from "@/features/activity/lib/activity-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/types";

export interface ActivityLogRecord {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  userName: string | null;
  userRole: string | null;
}

export interface ActivityLogFilters {
  module?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface CreateActivityLogInput {
  userId: string | null;
  action: string;
  module: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

const LOG_SELECT = `
  id,
  user_id,
  action,
  module,
  description,
  metadata,
  created_at,
  user:users!activity_logs_user_id_fkey(name, roles(slug))
`;

function mapActivityRow(row: Record<string, unknown>): ActivityLogRecord {
  const user = row.user;
  const userData = Array.isArray(user) ? user[0] : user;
  const roleRecord = (
    userData as { roles?: { slug?: string } | { slug?: string }[] } | null
  )?.roles;
  const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;

  return {
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    action: row.action as string,
    module: row.module as string,
    description: (row.description as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    userName: (userData as { name?: string } | null)?.name ?? null,
    userRole: roleData?.slug ?? null,
  };
}

/** Persist a district activity log entry. */
export async function createActivityLog(
  input: CreateActivityLogInput
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("activity_logs").insert({
      user_id: input.userId,
      action: input.action,
      module: input.module,
      description: input.description?.trim() || null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      console.error("[createActivityLog]", error.message);
    }
  } catch (error) {
    console.error("[createActivityLog]", error);
  }
}

/** Fetch activity logs — Collector, ACP, and ADM only. */
export async function getActivityLogs(
  user: SessionUser,
  filters: ActivityLogFilters = {}
): Promise<ActivityLogRecord[]> {
  if (!canViewActivityLog(user.role)) {
    return [];
  }

  const supabase = createAdminClient();
  const limit = filters.limit ?? 200;

  let query = supabase
    .from("activity_logs")
    .select(LOG_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.module) query = query.eq("module", filters.module);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getActivityLogs]", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapActivityRow(row as Record<string, unknown>)
  );
}
