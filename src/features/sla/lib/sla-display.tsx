import { Badge } from "@/components/ui/badge";
import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import type { SlaHealthStatus } from "@/features/sla/lib/sla-types";
import { cn } from "@/lib/utils";

export interface SlaDateInput {
  slaDueDate?: string | Date | null;
  dueDate?: string | Date | null;
  escalationLevel?: number;
}

function toIsoDateString(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "string") {
    return val.slice(0, 10);
  }
  return String(val).slice(0, 10);
}

/** Resolve effective SLA date — prefers sla_due_date, falls back to due_date. */
export function getEffectiveSlaDate(entry: SlaDateInput): string | null {
  return toIsoDateString(entry.slaDueDate) ?? toIsoDateString(entry.dueDate) ?? null;
}

/** Compute SLA health for badge coloring. */
export function getSlaHealthStatus(
  entry: SlaDateInput,
  today = getDistrictDateString()
): SlaHealthStatus {
  if ((entry.escalationLevel ?? 0) >= 1) {
    return "escalated";
  }

  const slaDate = getEffectiveSlaDate(entry);
  if (!slaDate) return "safe";

  if (slaDate < today) return "overdue";

  const tomorrow = addDaysToDateString(today, 1);
  if (slaDate <= tomorrow) return "due_soon";

  return "safe";
}

export const SLA_STATUS_LABELS: Record<SlaHealthStatus, string> = {
  safe: "Safe",
  due_soon: "Due Soon",
  overdue: "Overdue",
  escalated: "Escalated",
};

export const SLA_STATUS_STYLES: Record<SlaHealthStatus, string> = {
  safe: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  due_soon: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  overdue: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  escalated: "border-red-950/40 bg-red-950/15 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
};

interface SlaStatusBadgeProps {
  entry: SlaDateInput;
  className?: string;
}

export function SlaStatusBadge({ entry, className }: SlaStatusBadgeProps) {
  const status = getSlaHealthStatus(entry);
  const slaDate = getEffectiveSlaDate(entry);

  return (
    <Badge
      variant="outline"
      className={cn("capitalize", SLA_STATUS_STYLES[status], className)}
      title={slaDate ? `SLA due ${slaDate}` : undefined}
    >
      {SLA_STATUS_LABELS[status]}
    </Badge>
  );
}

function addDaysToDateString(dateStr: string, days: number): string {
  const cleanStr = toIsoDateString(dateStr) || new Date().toISOString().slice(0, 10);
  const [year, month, day] = cleanStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
