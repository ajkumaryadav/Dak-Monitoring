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
