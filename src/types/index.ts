/** Administrative roles defined for the DAK monitoring system. */
export type UserRole =
  | "collector"
  | "adm"
  | "district_officer"
  | "block_officer"
  | "clerk"
  | "data_entry_operator";

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
  permissions: string[];
}
