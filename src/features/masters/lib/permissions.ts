import type { UserRole } from "@/types";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";

/** Collector, ACP, ADM — Department & Section Master. */
export function canManageMasters(role: UserRole): boolean {
  return (
    (role === "collector" || role === "acp" || role === "adm") &&
    hasPermission(role, PERMISSIONS.MASTERS)
  );
}
