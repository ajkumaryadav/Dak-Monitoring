import type { UserRole } from "@/types";

export type ReportExportKind =
  | "pending"
  | "overdue"
  | "source"
  | "department"
  | "section";

/** Whether the role may export reports at all. */
export function canExportReports(role: UserRole): boolean {
  return (
    role === "collector" ||
    role === "acp" ||
    role === "adm" ||
    role === "department_user"
  );
}

/** Whether the role may export a specific report kind. */
export function canExportReportKind(
  role: UserRole,
  kind: ReportExportKind
): boolean {
  if (role === "dak_operator" || role === "section_user") {
    return false;
  }

  if (role === "collector" || role === "acp") {
    return true;
  }

  if (role === "adm") {
    return ["pending", "overdue", "source", "department", "section"].includes(
      kind
    );
  }

  if (role === "department_user") {
    return ["pending", "overdue", "department"].includes(kind);
  }

  return false;
}
