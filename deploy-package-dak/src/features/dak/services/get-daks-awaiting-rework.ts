import { createAdminClient } from "@/lib/supabase/admin";

import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import type { DakListEntry } from "@/features/dak/services/get-dak-stats";

const LIST_SELECT =
  "id, dak_number, subject, sender, priority, status, due_date, received_date, created_at, department_id, assignment_type, source_id, assignment_unit_id, departments(name), dak_sources(source_name), assignment_units(unit_name)";

/** DAKs returned for rework that are still awaiting revised compliance. */
export async function getDaksAwaitingRework(): Promise<DakListEntry[]> {
  const supabase = createAdminClient();

  const { data: returnEvents, error: timelineError } = await supabase
    .from("dak_timeline")
    .select("dak_id, metadata");

  if (timelineError || !returnEvents?.length) {
    return [];
  }

  const dakIds = [
    ...new Set(
      returnEvents
        .filter(
          (row) =>
            (row.metadata as Record<string, unknown> | null)?.returned_for_rework ===
            true
        )
        .map((row) => row.dak_id as string)
    ),
  ];

  if (!dakIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("dak_entries")
    .select(LIST_SELECT)
    .in("id", dakIds)
    .in("status", ["in_progress", "pending"])
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as DakListEntry[];
}

/** Convenience wrapper: pending approval queue plus rework queue for collector dashboard. */
export async function getCollectorReviewQueue(): Promise<{
  pendingApproval: DakListEntry[];
  awaitingRework: DakListEntry[];
}> {
  const [pendingApproval, awaitingRework] = await Promise.all([
    getFilteredDakList("pending_approval"),
    getDaksAwaitingRework(),
  ]);

  return { pendingApproval, awaitingRework };
}
