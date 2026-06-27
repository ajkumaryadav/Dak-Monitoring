/** Administrative roles for Stage 14 user management. */
export type UserRole =
  | "collector"
  | "acp"
  | "adm"
  | "dak_operator"
  | "department_user"
  | "section_user";

/** DAK workflow status values (DEO → Assign → DLO → Complete). */
export type DakStatus =
  | "received"
  | "assigned"
  | "in_progress"
  | "pending"
  | "completed"
  | "closed";

/** Priority levels for DAK items. */
export type PriorityLevel = "routine" | "important" | "urgent" | "immediate";

/** Assignment target type — external department or internal section. */
export type AssignmentType = "department" | "section";

/** DAK source master record. */
export interface DakSource {
  id: string;
  source_name: string;
  source_category: string;
}

/** Internal assignment unit (Collectorate section). */
export interface AssignmentUnit {
  id: string;
  unit_name: string;
  unit_type: AssignmentType;
}

/** Authenticated user session with role-based permissions. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleSlug: string;
  designation: string;
  departmentId: string | null;
  sectionId: string | null;
  mobile: string | null;
  employeeCode: string | null;
  isActive: boolean;
  permissions: string[];
}
