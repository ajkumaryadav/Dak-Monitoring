import type { PriorityLevel } from "@/types";

/** Default SLA days by priority — maps spec Normal/Low to Important/Routine. */
export const DEFAULT_SLA_DAYS: Record<PriorityLevel, number> = {
  immediate: 1,
  urgent: 3,
  important: 7,
  routine: 15,
};

/** Escalation tier labels stored in dak_entries.escalation_level. */
export const ESCALATION_LEVEL_LABELS: Record<number, string> = {
  0: "Assigned Officer",
  1: "Department Head",
  2: "Collector",
  3: "ACP",
  4: "ADM",
};

export const MAX_ESCALATION_LEVEL = 4;

/** Role slugs notified at each escalation tier (after escalation). */
export const ESCALATION_NOTIFY_ROLES: Record<number, readonly string[]> = {
  1: ["department_user"],
  2: ["collector"],
  3: ["acp"],
  4: ["adm"],
};

export function getEscalationLevelLabel(level: number): string {
  return ESCALATION_LEVEL_LABELS[level] ?? `Level ${level}`;
}

export function getDefaultSlaDays(priority: PriorityLevel): number {
  return DEFAULT_SLA_DAYS[priority] ?? 7;
}
