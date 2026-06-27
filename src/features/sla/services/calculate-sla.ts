import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import {
  getDefaultSlaDays,
  DEFAULT_SLA_DAYS,
} from "@/features/sla/lib/sla-constants";
import type { SlaRule } from "@/features/sla/lib/sla-types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PriorityLevel } from "@/types";

export interface CalculateSlaDateInput {
  priority: PriorityLevel;
  receivedDate?: string;
  departmentId?: string | null;
}

function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mapSlaRuleRow(row: Record<string, unknown>): SlaRule {
  return {
    id: row.id as string,
    departmentId: (row.department_id as string | null) ?? null,
    priority: row.priority as PriorityLevel,
    daysAllowed: row.days_allowed as number,
    isActive: row.is_active !== false,
  };
}

/** Fetch active SLA rule — department override first, then district default. */
export async function getSlaRule(
  priority: PriorityLevel,
  departmentId?: string | null
): Promise<SlaRule | null> {
  const supabase = createAdminClient();

  if (departmentId) {
    const { data: deptRule } = await supabase
      .from("sla_rules")
      .select("id, department_id, priority, days_allowed, is_active")
      .eq("department_id", departmentId)
      .eq("priority", priority)
      .eq("is_active", true)
      .maybeSingle();

    if (deptRule) {
      return mapSlaRuleRow(deptRule as Record<string, unknown>);
    }
  }

  const { data: globalRule, error } = await supabase
    .from("sla_rules")
    .select("id, department_id, priority, days_allowed, is_active")
    .is("department_id", null)
    .eq("priority", priority)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[getSlaRule]", error.message);
    return null;
  }

  return globalRule ? mapSlaRuleRow(globalRule as Record<string, unknown>) : null;
}

/** Compute SLA due date from received date, priority, and optional department rule. */
export async function calculateSlaDate(
  input: CalculateSlaDateInput
): Promise<string> {
  const receivedDate = (input.receivedDate ?? getDistrictDateString()).slice(
    0,
    10
  );

  const rule = await getSlaRule(input.priority, input.departmentId);
  const daysAllowed =
    rule?.daysAllowed ?? getDefaultSlaDays(input.priority);

  return addDaysToDateString(receivedDate, daysAllowed);
}

/** Synchronous fallback when DB rule lookup is unavailable. */
export function calculateSlaDateSync(
  priority: PriorityLevel,
  receivedDate = getDistrictDateString(),
  daysOverride?: number
): string {
  const days =
    daysOverride ?? DEFAULT_SLA_DAYS[priority] ?? 7;
  return addDaysToDateString(receivedDate.slice(0, 10), days);
}

/** List all active SLA rules for admin/reporting. */
export async function listActiveSlaRules(): Promise<SlaRule[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("sla_rules")
    .select("id, department_id, priority, days_allowed, is_active")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (error) {
    console.error("[listActiveSlaRules]", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapSlaRuleRow(row as Record<string, unknown>)
  );
}
