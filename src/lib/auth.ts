import { redirect } from "next/navigation";

import {
  canAccessRoute,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";
import type { SessionUser, UserRole } from "@/types";

export {
  PERMISSIONS,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS,
  canAccessRoute,
  canManageUsers,
  canReassignDakRole,
  getPermissionsForRole,
  hasMinimumRole,
  hasPermission,
  isDepartmentDashboardRole,
  isDistrictAdminRole,
  isOperatorDashboardRole,
  isCollectorDashboardRole,
  isSectionDashboardRole,
} from "@/lib/auth/permissions";
export type { Permission } from "@/lib/auth/permissions";

/** Require authenticated session; redirect to login if absent. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/** Require a specific permission; redirect to unauthorized if denied. */
export async function requirePermission(
  permission: Permission
): Promise<SessionUser> {
  const user = await requireAuth();

  if (!hasPermission(user.role, permission)) {
    redirect("/unauthorized");
  }

  return user;
}

/** Require access to a route based on role permissions. */
export async function requireRouteAccess(pathname: string): Promise<SessionUser> {
  const user = await requireAuth();

  if (!canAccessRoute(user.role, pathname)) {
    redirect("/unauthorized");
  }

  return user;
}

/** Require one of the allowed roles. */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<SessionUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}
