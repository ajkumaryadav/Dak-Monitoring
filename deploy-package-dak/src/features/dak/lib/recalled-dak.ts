import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns a Set of DAK IDs that are currently in the 'recalled' state
 * (i.e. recalled by DAK Operator and not subsequently forwarded or assigned).
 */
export async function getRecalledDakIdSet(targetDakIds?: string[]): Promise<Set<string>> {
  try {
    const supabase = createAdminClient();

    let query = supabase
      .from("dak_timeline")
      .select("dak_id, action_type, action_title, metadata, created_at")
      .order("created_at", { ascending: false });

    if (targetDakIds && targetDakIds.length > 0) {
      query = query.in("dak_id", targetDakIds);
    }

    const { data: events, error } = await query;
    if (error || !events) {
      return new Set<string>();
    }

    // Group timeline events by dak_id
    const eventsByDak = new Map<string, typeof events>();
    for (const event of events) {
      if (!eventsByDak.has(event.dak_id)) {
        eventsByDak.set(event.dak_id, []);
      }
      eventsByDak.get(event.dak_id)!.push(event);
    }

    const recalledSet = new Set<string>();

    for (const [dakId, dakEvents] of eventsByDak.entries()) {
      // Find the most recent transition between recall and forward/assign
      const relevantEvent = dakEvents.find((e) => {
        const meta = (e.metadata as Record<string, unknown>) ?? {};
        if (meta.recalled_by_operator === true || meta.return_to_registry === true) {
          return true;
        }
        if (
          meta.forwarded_to_collector === true ||
          e.action_type === "dak_assigned" ||
          /assigned/i.test(e.action_title)
        ) {
          return true;
        }
        return false;
      });

      if (relevantEvent) {
        const meta = (relevantEvent.metadata as Record<string, unknown>) ?? {};
        if (meta.recalled_by_operator === true || meta.return_to_registry === true) {
          recalledSet.add(dakId);
        }
      }
    }

    return recalledSet;
  } catch (err) {
    console.error("[getRecalledDakIdSet]", err);
    return new Set<string>();
  }
}
