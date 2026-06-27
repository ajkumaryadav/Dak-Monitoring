import { format, parseISO } from "date-fns";

import { getStatusLabel, normalizeDakStatus } from "@/features/dak/lib/workflow";
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
  in_progress:
    "border-[oklch(0.55_0.12_200)]/30 bg-[oklch(0.55_0.12_200)]/10 text-[oklch(0.4_0.1_200)]",
  pending:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  completed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  closed: "border-border bg-muted text-muted-foreground",
};

const legacyStatusStyles: Record<string, string> = {
  under_process: statusStyles.in_progress,
  disposed: statusStyles.completed,
  escalated: statusStyles.pending,
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
  return getStatusLabel(status);
}

export function getStatusStyle(status: string) {
  const normalized = normalizeDakStatus(status);
  return (
    statusStyles[normalized] ??
    legacyStatusStyles[status] ??
    "border-border bg-muted text-muted-foreground"
  );
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

export function getOfficerName(
  officer: { name: string } | { name: string }[] | null | undefined
) {
  if (!officer) {
    return "Not assigned";
  }

  if (Array.isArray(officer)) {
    return officer[0]?.name ?? "Not assigned";
  }

  return officer.name ?? "Not assigned";
}

export function getSourceName(
  source:
    | { source_name: string }
    | { source_name: string }[]
    | null
    | undefined
) {
  if (!source) {
    return "—";
  }

  if (Array.isArray(source)) {
    return source[0]?.source_name ?? "—";
  }

  return source.source_name ?? "—";
}

export function getUnitName(
  unit: { unit_name: string } | { unit_name: string }[] | null | undefined
) {
  if (!unit) {
    return "—";
  }

  if (Array.isArray(unit)) {
    return unit[0]?.unit_name ?? "—";
  }

  return unit.unit_name ?? "—";
}

export function formatAssignmentLabel(
  target: string,
  officerName: string | null | undefined
): string {
  const trimmed = officerName?.trim();
  if (!trimmed || trimmed === "Not assigned") {
    return target;
  }
  return `${target} → ${trimmed}`;
}

export function formatAssignmentType(
  assignmentType: string | null | undefined
) {
  if (!assignmentType) return "—";
  return assignmentType === "section" ? "Internal Section" : "Department";
}

export function getBadgeClassName(
  map: Record<string, string>,
  key: string,
  fallback: string
) {
  return cn("capitalize", map[key as keyof typeof map] ?? fallback);
}
