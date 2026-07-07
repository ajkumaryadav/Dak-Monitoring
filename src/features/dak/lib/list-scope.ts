import type { SessionUser } from "@/types";

export interface DakListScope {
  departmentId?: string | null;
  sectionId?: string | null;
}

/** Resolve list scoping from the signed-in user role. */
export function getDakListScope(user: SessionUser | null): DakListScope {
  if (!user) return {};

  if (user.role === "department_user" && user.departmentId) {
    return { departmentId: user.departmentId };
  }

  if (user.role === "section_user" && user.sectionId) {
    return { sectionId: user.sectionId };
  }

  return {};
}
