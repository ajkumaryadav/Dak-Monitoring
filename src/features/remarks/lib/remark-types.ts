/** Remark categories stored in dak_remarks.remark_type. */
export type DakRemarkType =
  | "remark"
  | "internal_note"
  | "collector_note"
  | "department_remark";

export const REMARK_TYPE_LABELS: Record<DakRemarkType, string> = {
  remark: "Remark",
  internal_note: "Internal Note",
  collector_note: "Collector Note",
  department_remark: "Department Remark",
};

export function getRemarkTypeLabel(type: DakRemarkType): string {
  return REMARK_TYPE_LABELS[type] ?? type;
}

/** Types visible only to Collector, ACP, and ADM. */
export const RESTRICTED_REMARK_TYPES: readonly DakRemarkType[] = [
  "internal_note",
  "collector_note",
];
