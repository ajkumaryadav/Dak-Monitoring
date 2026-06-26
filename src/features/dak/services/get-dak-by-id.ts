import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeDakStatus } from "@/features/dak/lib/workflow";
import type { DakStatus, PriorityLevel } from "@/types";

export interface DakDetail {
  id: string;
  dak_number: string;
  subject: string;
  sender: string;
  sender_address: string | null;
  priority: PriorityLevel;
  status: DakStatus;
  due_date: string | null;
  description: string | null;
  received_date: string | null;
  created_at: string;
  department_id: string | null;
  assigned_to: string | null;
  departments: { name: string } | { name: string }[] | null;
  assigned_officer: { name: string } | { name: string }[] | null;
}

export interface DakTimelineEntry {
  id: string;
  action: string;
  remarks: string | null;
  created_at: string;
  actor_name: string | null;
}

/** Fetch a single DAK entry by id. */
export async function getDakById(id: string): Promise<DakDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, sender, sender_address, priority, status, due_date, description, received_date, created_at, department_id, assigned_to, departments(name), assigned_officer:users!dak_entries_assigned_to_fkey(name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getDakById]", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as Omit<DakDetail, "status">),
    status: normalizeDakStatus(data.status as string),
  };
}

/** Fetch workflow timeline entries for a DAK item. */
export async function getDakTimeline(
  dakId: string
): Promise<DakTimelineEntry[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workflow_logs")
    .select("id, action, remarks, created_at, created_by_user:users!workflow_logs_created_by_fkey(name)")
    .eq("dak_id", dakId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getDakTimeline]", error.message);
    return [];
  }

  return (data ?? []).map((entry) => {
    const userRecord = entry.created_by_user;
    const userData = Array.isArray(userRecord) ? userRecord[0] : userRecord;

    return {
      id: entry.id as string,
      action: entry.action as string,
      remarks: entry.remarks as string | null,
      created_at: entry.created_at as string,
      actor_name: (userData?.name as string | undefined) ?? null,
    };
  });
}
