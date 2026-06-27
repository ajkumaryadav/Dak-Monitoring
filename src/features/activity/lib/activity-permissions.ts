import type { UserRole } from "@/types";

const ACTIVITY_LOG_ROLES: readonly UserRole[] = ["collector", "acp", "adm"];

/** Collector, ACP, and ADM can view the district activity log. */
export function canViewActivityLog(role: UserRole): boolean {
  return ACTIVITY_LOG_ROLES.includes(role);
}
