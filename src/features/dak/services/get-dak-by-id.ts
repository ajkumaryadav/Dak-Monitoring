import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeDakStatus } from "@/features/dak/lib/workflow";
import type { AssignmentType, DakStatus, PriorityLevel } from "@/types";

export type {
  DakHistoryEntry,
  DakTimelineEntry,
} from "@/features/audit/services/dak-history";
export {
  getDakHistory,
  getDakTimeline,
} from "@/features/audit/services/dak-history";

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
  disposed_date: string | null;
  closed_date: string | null;
  created_at: string;
  department_id: string | null;
  source_id: string | null;
  assignment_type: AssignmentType | null;
  assignment_unit_id: string | null;
  assigned_to: string | null;
  departments: { name: string } | { name: string }[] | null;
  dak_sources: { source_name: string } | { source_name: string }[] | null;
  assignment_units:
    | { unit_name: string }
    | { unit_name: string }[]
    | null;
  assigned_officer: { name: string } | { name: string }[] | null;
}

/** Fetch a single DAK entry by id. */
export async function getDakById(id: string): Promise<DakDetail | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, sender, sender_address, priority, status, due_date, description, received_date, disposed_date, closed_date, created_at, department_id, source_id, assignment_type, assignment_unit_id, assigned_to, departments(name), dak_sources(source_name), assignment_units(unit_name), assigned_officer:users!dak_entries_assigned_to_fkey(name)"
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
