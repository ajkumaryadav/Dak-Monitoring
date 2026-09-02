/** Resolve remark/ATR capabilities for the current user. */
import type { DakRemarkType } from "@/features/remarks/lib/remark-types";
import { RESTRICTED_REMARK_TYPES } from "@/features/remarks/lib/remark-types";
import {
  DISTRICT_ADMIN_ROLES,
  isCollectorDashboardRole,
} from "@/lib/auth/permissions";
import type { SessionUser, UserRole } from "@/types";

export interface RemarkPermissions {
  canViewAll: boolean;
  canViewRestricted: boolean;
  canAddRemark: boolean;
  canAddInternalNote: boolean;
  canAddCollectorNote: boolean;
  canAddDepartmentRemark: boolean;
  canSubmitAtr: boolean;
  canSubmitCompliance: boolean;
  isReadOnly: boolean;
  allowedRemarkTypes: DakRemarkType[];
}

function isDistrictAdmin(role: UserRole): boolean {
  return DISTRICT_ADMIN_ROLES.includes(role);
}

export function getRemarkPermissions(user: SessionUser): RemarkPermissions {
  const { role } = user;

  if (role === "dak_operator") {
    return {
      canViewAll: false,
      canViewRestricted: false,
      canAddRemark: false,
      canAddInternalNote: false,
      canAddCollectorNote: false,
      canAddDepartmentRemark: false,
      canSubmitAtr: false,
      canSubmitCompliance: false,
      isReadOnly: true,
      allowedRemarkTypes: [],
    };
  }

  if (isDistrictAdmin(role) || role === "adm") {
    const allowedRemarkTypes: DakRemarkType[] =
      role === "acp" ? ["internal_note"] : ["collector_note"];

    return {
      canViewAll: true,
      canViewRestricted: true,
      canAddRemark: true,
      canAddInternalNote: role === "acp",
      canAddCollectorNote: role !== "acp",
      canAddDepartmentRemark: false,
      canSubmitAtr: false,
      canSubmitCompliance: false,
      isReadOnly: false,
      allowedRemarkTypes,
    };
  }

  if (role === "department_user") {
    return {
      canViewAll: false,
      canViewRestricted: false,
      canAddRemark: false,
      canAddInternalNote: false,
      canAddCollectorNote: false,
      canAddDepartmentRemark: false,
      canSubmitAtr: false,
      canSubmitCompliance: true,
      isReadOnly: false,
      allowedRemarkTypes: [],
    };
  }

  if (role === "section_user") {
    return {
      canViewAll: false,
      canViewRestricted: false,
      canAddRemark: false,
      canAddInternalNote: false,
      canAddCollectorNote: false,
      canAddDepartmentRemark: false,
      canSubmitAtr: false,
      canSubmitCompliance: true,
      isReadOnly: false,
      allowedRemarkTypes: [],
    };
  }

  return {
    canViewAll: isCollectorDashboardRole(role),
    canViewRestricted: isCollectorDashboardRole(role),
    canAddRemark: false,
    canAddInternalNote: false,
    canAddCollectorNote: false,
    canAddDepartmentRemark: false,
    canSubmitAtr: false,
    canSubmitCompliance: false,
    isReadOnly: true,
    allowedRemarkTypes: [],
  };
}

export function canViewRemarkType(
  user: SessionUser,
  remarkType: DakRemarkType
): boolean {
  const perms = getRemarkPermissions(user);
  if (RESTRICTED_REMARK_TYPES.includes(remarkType)) {
    return perms.canViewRestricted;
  }
  return true;
}
