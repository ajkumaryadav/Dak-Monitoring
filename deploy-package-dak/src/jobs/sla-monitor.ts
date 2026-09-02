import {
  checkOverdueDaks,
  escalateOverdueDaks,
  getDueSoonDaks,
} from "@/features/sla/services/sla-escalation";
import { getEffectiveSlaDate } from "@/features/sla/lib/sla-display";
import {
  notifySlaDueTomorrow,
  notifySlaExpired,
} from "@/features/sla/services/notify-sla-event";

export interface SlaMonitorResult {
  dueSoonChecked: number;
  overdueChecked: number;
  escalated: number;
}

/**
 * Automatic SLA monitor — checks due-soon DAK, overdue alerts, and escalations.
 * Invoked on dashboard load and via npm run sla:monitor.
 */
export async function runSlaMonitor(): Promise<SlaMonitorResult> {
  const dueSoon = await getDueSoonDaks();
  const overdue = await checkOverdueDaks();

  for (const entry of dueSoon) {
    await notifySlaDueTomorrow({
      dakId: entry.id,
      dakNumber: entry.dak_number,
      subject: entry.subject,
      slaDueDate: getEffectiveSlaDate({
        slaDueDate: entry.sla_due_date,
        dueDate: entry.due_date,
      }),
      assignedToUserId: entry.assigned_to,
      departmentId: entry.department_id,
    });
  }

  for (const entry of overdue) {
    await notifySlaExpired({
      dakId: entry.id,
      dakNumber: entry.dak_number,
      subject: entry.subject,
      slaDueDate: getEffectiveSlaDate({
        slaDueDate: entry.sla_due_date,
        dueDate: entry.due_date,
      }),
      assignedToUserId: entry.assigned_to,
      departmentId: entry.department_id,
    });
  }

  const escalated = await escalateOverdueDaks();

  return {
    dueSoonChecked: dueSoon.length,
    overdueChecked: overdue.length,
    escalated,
  };
}
