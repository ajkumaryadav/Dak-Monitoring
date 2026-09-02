import type { SessionUser } from "@/types";

import {
  DEPARTMENT_REQUEST_STATUSES,
} from "@/features/dak-requests/lib/request-types";
import { normalizeDakStatus } from "@/features/dak/lib/workflow";
import { canUpdateDakStatusRole } from "@/lib/auth/permissions";

export function canSubmitDepartmentRequests(
  user: SessionUser,
  dakStatus: string
): boolean {
  if (!canUpdateDakStatusRole(user.role)) {
    return false;
  }

  const normalized = normalizeDakStatus(dakStatus);
  return DEPARTMENT_REQUEST_STATUSES.includes(
    normalized as (typeof DEPARTMENT_REQUEST_STATUSES)[number]
  );
}

export function canReviewDepartmentRequests(user: SessionUser): boolean {
  return user.role === "collector" || user.role === "adm";
}
