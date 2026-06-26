import { format, parseISO } from "date-fns";

import type { DakStatus, PriorityLevel } from "@/types";
import { cn } from "@/lib/utils";

export const priorityStyles: Record<PriorityLevel, string> = {
  routine: "bg-muted text-muted-foreground",
  important: "bg-primary/10 text-primary",
  urgent: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  immediate: "bg-destructive/10 text-destructive",
};

export const statusStyles: Record<DakStatus, string> = {
  received: "border-primary/30 bg-primary/5 text-primary",
  assigned:
    "border-[oklch(0.45_0.11_240)]/30 bg-[oklch(0.45_0.11_240)]/10 text-[oklch(0.38_0.11_240)]",
  under_process:
    "border-[oklch(0.55_0.12_200)]/30 bg-[oklch(0.55_0.12_200)]/10 text-[oklch(0.4_0.1_200)]",
  pending:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  escalated:
    "border-orange-600/30 bg-orange-600/10 text-orange-700 dark:text-orange-400",
  disposed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  closed: "border-border bg-muted text-muted-foreground",
};

export function formatDakDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

export function formatDakDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  try {
    return format(parseISO(value), "dd MMM yyyy, h:mm a");
  } catch {
    return value;
  }
}

export function formatDakStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function getDepartmentName(
  departments: { name: string } | { name: string }[] | null | undefined
) {
  if (!departments) {
    return "—";
  }

  if (Array.isArray(departments)) {
    return departments[0]?.name ?? "—";
  }

  return departments.name ?? "—";
}

export function getBadgeClassName(
  map: Record<string, string>,
  key: string,
  fallback: string
) {
  return cn("capitalize", map[key as keyof typeof map] ?? fallback);
}
