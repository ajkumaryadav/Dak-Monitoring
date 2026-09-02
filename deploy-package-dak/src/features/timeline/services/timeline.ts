import type { DakHistoryEventType } from "@/features/audit/lib/history-events";
import type { DakTimelineActionType } from "@/features/timeline/lib/timeline-types";
import { isOperatorDashboardRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/types";

export interface DakTimelineEvent {
  id: string;
  dakId: string;
  actionType: DakTimelineActionType;
  actionTitle: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  performerName: string | null;
  performerRole: string | null;
}

export interface CreateTimelineEventInput {
  dakId: string;
  actionType: DakTimelineActionType;
  actionTitle: string;
  description?: string | null;
  performedBy: string;
  metadata?: Record<string, unknown>;
}

const TIMELINE_SELECT = `
  id,
  dak_id,
  action_type,
  action_title,
  description,
  metadata,
  created_at,
  performer:users!dak_timeline_performed_by_fkey(name, roles(slug))
`;

function mapTimelineRow(row: Record<string, unknown>): DakTimelineEvent {
  const performer = row.performer;
  const performerData = Array.isArray(performer) ? performer[0] : performer;
  const roleRecord = (
    performerData as { roles?: { slug?: string } | { slug?: string }[] } | null
  )?.roles;
  const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;

  return {
    id: row.id as string,
    dakId: row.dak_id as string,
    actionType: row.action_type as DakTimelineActionType,
    actionTitle: row.action_title as string,
    description: (row.description as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    performerName: (performerData as { name?: string } | null)?.name ?? null,
    performerRole: roleData?.slug ?? null,
  };
}

/** Map legacy dak_history event types to dak_timeline action types. */
export function mapHistoryEventToTimelineAction(
  eventType: DakHistoryEventType,
  actionLabel?: string
): DakTimelineActionType {
  if (eventType === "dak_registered") return "dak_created";
  if (eventType === "assigned") return "dak_assigned";
  if (eventType === "reassigned" || eventType === "section_transfer") {
    return "dak_reassigned";
  }
  if (eventType === "closed") return "closed";
  if (eventType === "atr_submitted") return "atr_submitted";
  if (eventType === "remarks_added") {
    const label = actionLabel?.toLowerCase() ?? "";
    if (label.includes("attachment") || label.includes("upload")) {
      return "file_uploaded";
    }
    return "remark_added";
  }
  return "status_changed";
}

/** Persist a DAK timeline event. */
export async function createTimelineEvent(
  input: CreateTimelineEventInput
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("dak_timeline").insert({
    dak_id: input.dakId,
    action_type: input.actionType,
    action_title: input.actionTitle,
    description: input.description?.trim() || null,
    performed_by: input.performedBy,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("[createTimelineEvent]", error.message);
    return {
      success: false,
      message: error.message ?? "Failed to record timeline event.",
    };
  }

  return { success: true };
}

/** Fetch chronological timeline for a DAK — operators scoped to own registrations. */
export async function getDakTimeline(
  dakId: string,
  user?: SessionUser | null
): Promise<DakTimelineEvent[]> {
  const supabase = createAdminClient();

  if (user && isOperatorDashboardRole(user.role)) {
    const { data: dak } = await supabase
      .from("dak_entries")
      .select("created_by")
      .eq("id", dakId)
      .maybeSingle();

    if (!dak || dak.created_by !== user.id) {
      return [];
    }
  }

  const { data, error } = await supabase
    .from("dak_timeline")
    .select(TIMELINE_SELECT)
    .eq("dak_id", dakId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[getDakTimeline]", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapTimelineRow(row as Record<string, unknown>)
  );
}
