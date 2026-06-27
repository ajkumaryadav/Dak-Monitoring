import type { UserRole } from "@/types";

export type ReportExportKind =
  | "pending"
  | "overdue"
  | "source"
  | "department"
  | "section";

/** Whether the role may export reports at all. */
export function canExportReports(role: UserRole): boolean {
  return role === "collector" || role === "adm" || role === "district_officer";
}

/** Whether the role may export a specific report kind. */
export function canExportReportKind(
  role: UserRole,
  kind: ReportExportKind
): boolean {
  if (role === "data_entry_operator" || role === "clerk" || role === "block_officer") {
    return false;
  }

  if (role === "collector") {
    return true;
  }

  if (role === "adm") {
    return ["pending", "overdue", "source", "department", "section"].includes(
      kind
    );
  }

  if (role === "district_officer") {
    return ["pending", "overdue", "department"].includes(kind);
  }

  return false;
}
