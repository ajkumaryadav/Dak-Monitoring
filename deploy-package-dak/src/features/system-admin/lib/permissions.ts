import type { UserRole } from "@/types";
import {
  hasPermission,
  PERMISSIONS,
  type Permission,
} from "@/lib/auth/permissions";

/** Collector + ACP only — Database & Storage Management module. */
export function canAccessDatabaseStorage(role: UserRole): boolean {
  return (
    (role === "collector" || role === "acp") &&
    hasPermission(role, PERMISSIONS.DATABASE_STORAGE)
  );
}

/** Soft-delete users — ACP only. */
export function canPermanentlyDeleteUser(role: UserRole): boolean {
  return role === "acp";
}

/** Move DAK to Recycle Bin — Collector and ACP. */
export function canMoveDakToRecycleBin(role: UserRole): boolean {
  return role === "collector" || role === "acp";
}

/** Permanent DAK deletion from Recycle Bin — ACP only. */
export function canPermanentlyDeleteDak(role: UserRole): boolean {
  return role === "acp";
}

export function requireDatabaseStoragePermission(
  role: UserRole
): asserts role is UserRole {
  if (!canAccessDatabaseStorage(role)) {
    throw new Error("You do not have access to Database & Storage Management.");
  }
}

/** Re-export for route guards. */
export const DATABASE_STORAGE_PERMISSION: Permission =
  PERMISSIONS.DATABASE_STORAGE;
