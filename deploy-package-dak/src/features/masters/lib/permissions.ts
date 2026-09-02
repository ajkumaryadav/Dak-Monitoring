import type { UserRole } from "@/types";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";

/** Only ACP can manage Department & Section Master. */
export function canManageMasters(role: UserRole): boolean {
  return role === "acp" && hasPermission(role, PERMISSIONS.MASTERS);
}
