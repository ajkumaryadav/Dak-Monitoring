import { COLLECTOR_DASHBOARD_ROLES } from "@/lib/auth/permissions";
import type { SessionUser } from "@/types";

import {
  TRANSFER_ACTIONS,
  type TransferAction,
} from "@/features/transfer/lib/transfer-types";

export function canPerformTransfer(
  user: SessionUser,
  action: TransferAction
): boolean {
  if (action === "adm_guidance") {
    return user.role === "adm";
  }
  if (action === "manual_escalate") {
    return COLLECTOR_DASHBOARD_ROLES.includes(user.role);
  }
  if (
    action === "forward_adm" ||
    action === "forward_collector" ||
    action === "transfer_department" ||
    action === "return_clarification"
  ) {
    return user.role === "department_user" || user.role === "section_user";
  }
  return false;
}

export function getAvailableTransferActions(user: SessionUser) {
  return TRANSFER_ACTIONS.filter((action) =>
    canPerformTransfer(user, action.value)
  );
}
