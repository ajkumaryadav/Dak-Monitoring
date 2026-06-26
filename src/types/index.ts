/** Administrative roles defined for the DAK monitoring system. */
export type UserRole =
  | "collector"
  | "adm"
  | "district_officer"
  | "block_officer"
  | "clerk"
  | "data_entry_operator";

/** DAK workflow status values. */
export type DakStatus =
  | "received"
  | "assigned"
  | "under_process"
  | "pending"
  | "escalated"
  | "disposed"
  | "closed";

/** Priority levels for DAK items. */
export type PriorityLevel = "routine" | "important" | "urgent" | "immediate";

/** Placeholder session user for the admin shell until Auth module is wired. */
export interface SessionUser {
  name: string;
  email: string;
  role: UserRole;
  designation: string;
}
