import type { UserRole } from "@/types";

/** Permission keys for role-based access — extend as modules are added. */
export const PERMISSIONS = {
  ALL: "all",
  DASHBOARD: "dashboard",
  DAK_ENTRY: "dak:entry",
  DAK_VIEW: "dak:view",
  TASKS: "tasks",
  DEPARTMENT: "department",
  UPDATES: "updates",
  REPORTS: "reports",
  ESCALATION: "escalation",
  USERS: "users",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Route → required permission mapping for future module guards. */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": PERMISSIONS.DASHBOARD,
  "/dashboard/dak/new": PERMISSIONS.DAK_ENTRY,
  "/dashboard/dak": PERMISSIONS.DAK_VIEW,
  "/dashboard/tasks": PERMISSIONS.TASKS,
  "/dashboard/reports": PERMISSIONS.REPORTS,
  "/users": PERMISSIONS.USERS,
};

/**
 * Role → permissions map (AGENTS.md administrative roles).
 * Collector has full access; other roles are scoped per module.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  collector: [PERMISSIONS.ALL],
  adm: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.TASKS,
    PERMISSIONS.DEPARTMENT,
    PERMISSIONS.REPORTS,
    PERMISSIONS.ESCALATION,
  ],
  district_officer: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.TASKS,
    PERMISSIONS.DEPARTMENT,
    PERMISSIONS.UPDATES,
  ],
  block_officer: [PERMISSIONS.DASHBOARD, PERMISSIONS.TASKS, PERMISSIONS.UPDATES],
  clerk: [PERMISSIONS.DASHBOARD, PERMISSIONS.DAK_VIEW, PERMISSIONS.TASKS],
  data_entry_operator: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.DAK_ENTRY,
    PERMISSIONS.DAK_VIEW,
  ],
};

/** Role hierarchy — lower number = higher authority. */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  collector: 1,
  adm: 2,
  district_officer: 3,
  block_officer: 4,
  clerk: 5,
  data_entry_operator: 6,
};

export function getPermissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(PERMISSIONS.ALL) || permissions.includes(permission);
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!matchedRoute) {
    return true;
  }

  return hasPermission(role, ROUTE_PERMISSIONS[matchedRoute]);
}

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[minimumRole];
}
