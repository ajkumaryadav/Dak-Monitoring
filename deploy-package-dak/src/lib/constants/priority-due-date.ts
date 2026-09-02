import { addDaysToDateString, getDistrictDateString } from "@/features/dak/lib/dak-dates";
import type { PriorityLevel } from "@/types";

/**
 * Configurable disposal due-date offsets (days from assignment date).
 * Adjust these values to match Collectorate policy.
 */
export const DISPOSAL_DUE_DAYS_CONFIG = {
  immediate: 0,
  urgent: 3,
  high: 7,
  normal: 15,
  low: 30,
} as const;

/** Maps application priority enum → disposal offset days. */
export const PRIORITY_DISPOSAL_DAYS: Record<PriorityLevel, number> = {
  immediate: DISPOSAL_DUE_DAYS_CONFIG.immediate,
  urgent: DISPOSAL_DUE_DAYS_CONFIG.urgent,
  important: DISPOSAL_DUE_DAYS_CONFIG.normal,
  routine: DISPOSAL_DUE_DAYS_CONFIG.low,
};

/** Calculate disposal due date from priority and base assignment date. */
export function calculateDisposalDueDate(
  priority: PriorityLevel,
  baseDate = getDistrictDateString()
): string {
  const offsetDays = PRIORITY_DISPOSAL_DAYS[priority] ?? DISPOSAL_DUE_DAYS_CONFIG.normal;
  return addDaysToDateString(baseDate, offsetDays);
}

export function isValidDisposalDueDate(
  dueDate: string,
  minDate = getDistrictDateString()
): boolean {
  return dueDate.slice(0, 10) >= minDate.slice(0, 10);
}
