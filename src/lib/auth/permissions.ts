import type { UserRole } from "@/types";

/** Permission keys for role-based access — extend as modules are added. */
export const PERMISSIONS = {
  ALL: "all",
  DASHBOARD: "dashboard",
  DAK_ENTRY: "dak:entry",
  DAK_VIEW: "dak:view",
  DAK_ASSIGN: "dak:assign",
  DAK_UPDATE: "dak:update",
  TASKS: "tasks",
  TASKS_MANAGE: "tasks:manage",
  DEPARTMENT: "department",
  UPDATES: "updates",
  REPORTS: "reports",
  AUDIT: "audit",
  ESCALATION: "escalation",
  NOTIFICATIONS: "notifications",
  USERS: "users",
  ACTIVITY: "activity",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Route → required permission mapping for module guards. */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": PERMISSIONS.DASHBOARD,
  "/dashboard/dak/new": PERMISSIONS.DAK_ENTRY,
  "/dashboard/dak/assignments": PERMISSIONS.DAK_ASSIGN,
  "/dashboard/dak/assigned": PERMISSIONS.DAK_VIEW,
  "/dashboard/dak/pending-approval": PERMISSIONS.DAK_ASSIGN,
  "/dashboard/dak/pending": PERMISSIONS.DAK_VIEW,
  "/dashboard/tasks/new": PERMISSIONS.TASKS_MANAGE,
  "/dashboard/dak/completed": PERMISSIONS.DAK_VIEW,
  "/dashboard/dak": PERMISSIONS.DAK_VIEW,
  "/dashboard/tasks": PERMISSIONS.TASKS,
  "/dashboard/reports/pending": PERMISSIONS.DAK_VIEW,
  "/dashboard/reports/sla": PERMISSIONS.REPORTS,
  "/dashboard/reports/escalation": PERMISSIONS.REPORTS,
  "/dashboard/reports/atr-pending": PERMISSIONS.DAK_VIEW,
  "/dashboard/reports/atr-submitted": PERMISSIONS.DAK_VIEW,
  "/dashboard/reports/source": PERMISSIONS.REPORTS,
  "/dashboard/reports/departments": PERMISSIONS.REPORTS,
  "/dashboard/reports/sections": PERMISSIONS.REPORTS,
  "/dashboard/reports/officers": PERMISSIONS.REPORTS,
  "/dashboard/reports": PERMISSIONS.REPORTS,
  "/dashboard/audit": PERMISSIONS.AUDIT,
  "/dashboard/activity": PERMISSIONS.ACTIVITY,
  "/dashboard/notifications": PERMISSIONS.NOTIFICATIONS,
  "/dashboard/admin/users": PERMISSIONS.USERS,
};

/** Collector and ACP — district oversight roles (distinct menus and privileges). */
export const DISTRICT_ADMIN_ROLES: readonly UserRole[] = ["collector", "acp"];

/** Roles that can create, assign, approve, and reassign tasks. */
export const TASK_MANAGE_ROLES: readonly UserRole[] = ["collector", "adm"];

/** Collector — district admin without DAK registration or operational status updates. */
export const COLLECTOR_ROLE_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.DASHBOARD,
  PERMISSIONS.DAK_VIEW,
  PERMISSIONS.DAK_ASSIGN,
  PERMISSIONS.TASKS,
  PERMISSIONS.TASKS_MANAGE,
  PERMISSIONS.REPORTS,
  PERMISSIONS.AUDIT,
  PERMISSIONS.ACTIVITY,
  PERMISSIONS.NOTIFICATIONS,
  PERMISSIONS.USERS,
  PERMISSIONS.ESCALATION,
];

/** ACP — monitoring and supervision without DAK registration or task creation. */
export const ACP_ROLE_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.DASHBOARD,
  PERMISSIONS.DAK_VIEW,
  PERMISSIONS.TASKS,
  PERMISSIONS.REPORTS,
  PERMISSIONS.NOTIFICATIONS,
];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  collector: COLLECTOR_ROLE_PERMISSIONS,
  acp: ACP_ROLE_PERMISSIONS,
  adm: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.DAK_VIEW,
    PERMISSIONS.DAK_ASSIGN,
    PERMISSIONS.TASKS,
    PERMISSIONS.TASKS_MANAGE,
    PERMISSIONS.DEPARTMENT,
    PERMISSIONS.REPORTS,
    PERMISSIONS.AUDIT,
    PERMISSIONS.ACTIVITY,
    PERMISSIONS.NOTIFICATIONS,
    PERMISSIONS.ESCALATION,
  ],
  dak_operator: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.DAK_ENTRY,
    PERMISSIONS.DAK_VIEW,
    PERMISSIONS.NOTIFICATIONS,
  ],
  department_user: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.DAK_VIEW,
    PERMISSIONS.DAK_UPDATE,
    PERMISSIONS.AUDIT,
    PERMISSIONS.NOTIFICATIONS,
    PERMISSIONS.TASKS,
    PERMISSIONS.DEPARTMENT,
    PERMISSIONS.UPDATES,
  ],
  section_user: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.DAK_VIEW,
    PERMISSIONS.DAK_UPDATE,
    PERMISSIONS.NOTIFICATIONS,
    PERMISSIONS.TASKS,
    PERMISSIONS.UPDATES,
  ],
};

/** Roles that see operator-scoped dashboard (own registrations only). */
export const OPERATOR_DASHBOARD_ROLES: readonly UserRole[] = ["dak_operator"];

/** Routes the DAK Operator must never access (even with dak:view). */
export const OPERATOR_BLOCKED_ROUTE_PREFIXES: readonly string[] = [
  "/dashboard/dak/pending",
  "/dashboard/dak/completed",
  "/dashboard/dak/assignments",
  "/dashboard/dak/pending-approval",
  "/dashboard/tasks",
  "/dashboard/reports",
  "/dashboard/audit",
  "/dashboard/activity",
  "/dashboard/admin",
];

/** Roles that see full district dashboard (analytics, reports widgets). */
export const COLLECTOR_DASHBOARD_ROLES: readonly UserRole[] = [
  "collector",
  "acp",
  "adm",
];

/** Roles that see department-scoped dashboard metrics. */
export const DEPARTMENT_DASHBOARD_ROLES: readonly UserRole[] = [
  "department_user",
];

/** Roles that see section-scoped views. */
export const SECTION_DASHBOARD_ROLES: readonly UserRole[] = ["section_user"];

/** Role hierarchy — lower number = higher authority. */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  collector: 1,
  acp: 1,
  adm: 2,
  department_user: 3,
  section_user: 4,
  dak_operator: 5,
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

export function isOperatorBlockedRoute(
  role: UserRole,
  pathname: string
): boolean {
  if (role !== "dak_operator") {
    return false;
  }

  return OPERATOR_BLOCKED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (isOperatorBlockedRoute(role, pathname)) {
    return false;
  }

  const matchedRoute = Object.keys(ROUTE_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find(
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

export function isDepartmentDashboardRole(role: UserRole): boolean {
  return DEPARTMENT_DASHBOARD_ROLES.includes(role);
}

export function isSectionDashboardRole(role: UserRole): boolean {
  return SECTION_DASHBOARD_ROLES.includes(role);
}

export function isOperatorDashboardRole(role: UserRole): boolean {
  return OPERATOR_DASHBOARD_ROLES.includes(role);
}

export function isCollectorDashboardRole(role: UserRole): boolean {
  return COLLECTOR_DASHBOARD_ROLES.includes(role);
}

/** Only Collector can manage district user accounts. */
export function canManageUsers(role: UserRole): boolean {
  return role === "collector";
}

/** Collector or ACP — district-wide oversight (remarks, alerts). */
export function isDistrictAdminRole(role: UserRole): boolean {
  return DISTRICT_ADMIN_ROLES.includes(role);
}

/** Collector, ACP, and ADM can reassign in-workflow DAK. */
export function canReassignDakRole(role: UserRole): boolean {
  return role === "collector" || role === "adm";
}

/** Collector and ADM can create, assign, approve, and reassign tasks. */
export function canManageTasks(role: UserRole): boolean {
  return TASK_MANAGE_ROLES.includes(role);
}

/** Only department/section officers update operational DAK status. */
export function canUpdateDakStatusRole(role: UserRole): boolean {
  return role === "department_user" || role === "section_user";
}
