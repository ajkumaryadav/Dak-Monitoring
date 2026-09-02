import type { UserRole } from "@/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  collector: "Collector",
  acp: "ACP",
  adm: "ADM",
  dak_operator: "DAK Operator",
  department_user: "Department User",
  section_user: "Section User",
};

export const MANAGEABLE_ROLES: UserRole[] = [
  "collector",
  "acp",
  "adm",
  "dak_operator",
  "department_user",
  "section_user",
];

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function roleRequiresDepartment(role: UserRole): boolean {
  return role === "department_user";
}

export function roleRequiresSection(role: UserRole): boolean {
  return role === "section_user";
}
