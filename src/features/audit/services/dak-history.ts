import {
  getHistoryEventLabel,
  type DakHistoryEventType,
} from "@/features/audit/lib/history-events";
import { isDepartmentDashboardRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/types";

export interface DakHistoryEntry {
  id: string;
  dakId: string;
  eventType: DakHistoryEventType;
  actionLabel: string;
  remarks: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  performerName: string | null;
  performerRole: string | null;
  dakNumber?: string;
  dakSubject?: string;
}

export interface RecordHistoryInput {
  dakId: string;
  performedBy: string;
  eventType: DakHistoryEventType;
  actionLabel?: string;
  remarks?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditLogFilters {
  eventType?: DakHistoryEventType | "";
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

const HISTORY_SELECT = `
  id,
  dak_id,
  event_type,
  action_label,
  remarks,
  from_status,
  to_status,
  metadata,
  created_at,
  performer:users!dak_history_performed_by_fkey(name, roles(slug, name)),
  dak:dak_entries!dak_history_dak_id_fkey(dak_number, subject, department_id)
`;

const MIGRATION_HINT =
  "Run supabase/migrations/000010_dak_history.sql in the Supabase SQL Editor (Dashboard → SQL → New query), then wait a few seconds and refresh the app.";

let historyTableMissingLogged = false;

function isMissingHistoryTableError(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("dak_history") ||
    message.includes("schema cache")
  );
}

function logHistoryTableMissing(context: string): void {
  if (historyTableMissingLogged) {
    return;
  }

  historyTableMissingLogged = true;
  console.warn(`[${context}] dak_history table is not available. ${MIGRATION_HINT}`);
}

function logHistoryError(context: string, error: { message?: string; code?: string }): void {
  if (isMissingHistoryTableError(error)) {
    logHistoryTableMissing(context);
    return;
  }

  console.error(`[${context}]`, error.message ?? error);
}

function mapHistoryRow(row: Record<string, unknown>): DakHistoryEntry {
  const performer = row.performer;
  const performerData = Array.isArray(performer) ? performer[0] : performer;
  const roleRecord = (
    performerData as { roles?: { slug?: string; name?: string } | { slug?: string; name?: string }[] } | null
  )?.roles;
  const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;

  const dak = row.dak;
  const dakData = Array.isArray(dak) ? dak[0] : dak;

  return {
    id: row.id as string,
    dakId: row.dak_id as string,
    eventType: row.event_type as DakHistoryEventType,
    actionLabel: row.action_label as string,
    remarks: (row.remarks as string | null) ?? null,
    fromStatus: (row.from_status as string | null) ?? null,
    toStatus: (row.to_status as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    performerName:
      (performerData as { name?: string } | null)?.name ?? null,
    performerRole: roleData?.slug ?? roleData?.name ?? null,
    dakNumber: (dakData as { dak_number?: string } | undefined)?.dak_number,
    dakSubject: (dakData as { subject?: string } | undefined)?.subject,
  };
}

/** Persist an audit history entry for a DAK action. */
export async function recordHistory(
  input: RecordHistoryInput
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();

  const payload = {
    dak_id: input.dakId,
    event_type: input.eventType,
    action_label: input.actionLabel ?? getHistoryEventLabel(input.eventType),
    remarks: input.remarks?.trim() || null,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    metadata: input.metadata ?? {},
    performed_by: input.performedBy,
  };

  const { error } = await supabase.from("dak_history").insert(payload);

  if (error) {
    logHistoryError("recordHistory", error);
    return {
      success: false,
      message: isMissingHistoryTableError(error)
        ? "Audit history table is not set up. Ask an administrator to run migration 000010."
        : (error.message ?? "Failed to record audit history."),
    };
  }

  return { success: true };
}

/** Fetch chronological history for a single DAK (timeline). */
export async function getDakHistory(dakId: string): Promise<DakHistoryEntry[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dak_history")
    .select(HISTORY_SELECT)
    .eq("dak_id", dakId)
    .order("created_at", { ascending: true });

  if (error) {
    logHistoryError("getDakHistory", error);
    return [];
  }

  return (data ?? []).map((row) => mapHistoryRow(row as Record<string, unknown>));
}

/** Recent district/department activity for dashboard widget. */
export async function getRecentActivity(
  user: SessionUser,
  limit = 10
): Promise<DakHistoryEntry[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("dak_history")
    .select(HISTORY_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (isDepartmentDashboardRole(user.role) && user.departmentId) {
    const { data: dakIds, error: dakError } = await supabase
      .from("dak_entries")
      .select("id")
      .eq("department_id", user.departmentId);

    if (dakError) {
      console.error("[getRecentActivity]", dakError.message);
      return [];
    }

    const ids = (dakIds ?? []).map((row) => row.id as string);

    if (!ids.length) {
      return [];
    }

    query = query.in("dak_id", ids);
  }

  const { data, error } = await query;

  if (error) {
    logHistoryError("getRecentActivity", error);
    return [];
  }

  return (data ?? []).map((row) => mapHistoryRow(row as Record<string, unknown>));
}

/** Paginated audit log for the audit hub page. */
export async function getAuditLog(
  user: SessionUser,
  filters: AuditLogFilters = {}
): Promise<DakHistoryEntry[]> {
  const supabase = createAdminClient();
  const limit = filters.limit ?? 100;

  let query = supabase
    .from("dak_history")
    .select(HISTORY_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.eventType) {
    query = query.eq("event_type", filters.eventType);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  }

  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
  }

  if (isDepartmentDashboardRole(user.role) && user.departmentId) {
    const { data: dakIds, error: dakError } = await supabase
      .from("dak_entries")
      .select("id")
      .eq("department_id", user.departmentId);

    if (dakError) {
      console.error("[getAuditLog]", dakError.message);
      return [];
    }

    const ids = (dakIds ?? []).map((row) => row.id as string);

    if (!ids.length) {
      return [];
    }

    query = query.in("dak_id", ids);
  }

  const { data, error } = await query;

  if (error) {
    logHistoryError("getAuditLog", error);
    return [];
  }

  return (data ?? []).map((row) => mapHistoryRow(row as Record<string, unknown>));
}

/** @deprecated Use getDakHistory — kept for existing imports. */
export async function getDakTimeline(dakId: string): Promise<DakHistoryEntry[]> {
  return getDakHistory(dakId);
}

export type DakTimelineEntry = DakHistoryEntry;
