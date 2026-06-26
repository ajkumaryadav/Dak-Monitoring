import { createAdminClient } from "@/lib/supabase/admin";
import type { DakStatus, PriorityLevel } from "@/types";

import { ACTIVE_STATUSES, TERMINAL_STATUSES } from "@/features/dak/lib/workflow";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";

export type DakListFilter = "all" | "pending" | "completed";

export interface DakListEntry {
  id: string;
  dak_number: string;
  subject: string;
  sender: string;
  priority: PriorityLevel;
  status: DakStatus;
  due_date: string | null;
  departments: { name: string } | { name: string }[] | null;
}

export interface DashboardStats {
  total: number;
  pending: number;
  overdue: number;
  completed: number;
  highPriority: number;
}

/** Fetch DAK entries for list views with optional status filter. */
export async function getDakList(
  filter: DakListFilter = "all"
): Promise<DakListEntry[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("dak_entries")
    .select(
      "id, dak_number, subject, sender, priority, status, due_date, departments(name)"
    )
    .order("created_at", { ascending: false });

  if (filter === "pending") {
    query = query.in("status", [...ACTIVE_STATUSES]);
  } else if (filter === "completed") {
    query = query.in("status", [...TERMINAL_STATUSES]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getDakList]", error.message);
    return [];
  }

  return (data ?? []) as DakListEntry[];
}

/** Aggregate dashboard statistics for DAK monitoring widgets. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const today = getDistrictDateString();

  const { data, error } = await supabase
    .from("dak_entries")
    .select("status, priority, due_date");

  if (error) {
    console.error("[getDashboardStats]", error.message);
    return {
      total: 0,
      pending: 0,
      overdue: 0,
      completed: 0,
      highPriority: 0,
    };
  }

  const entries = data ?? [];
  const terminalSet = new Set<string>(TERMINAL_STATUSES);
  const activeSet = new Set<string>(ACTIVE_STATUSES);
  const highPrioritySet = new Set<PriorityLevel>(["urgent", "immediate"]);

  let pending = 0;
  let overdue = 0;
  let completed = 0;
  let highPriority = 0;

  for (const entry of entries) {
    const status = entry.status as DakStatus;
    const priority = entry.priority as PriorityLevel;
    const isTerminal = terminalSet.has(status);

    if (activeSet.has(status)) {
      pending += 1;
    }

    if (isTerminal) {
      completed += 1;
    }

    if (
      entry.due_date &&
      entry.due_date < today &&
      !isTerminal
    ) {
      overdue += 1;
    }

    if (!isTerminal && highPrioritySet.has(priority)) {
      highPriority += 1;
    }
  }

  return {
    total: entries.length,
    pending,
    overdue,
    completed,
    highPriority,
  };
}
