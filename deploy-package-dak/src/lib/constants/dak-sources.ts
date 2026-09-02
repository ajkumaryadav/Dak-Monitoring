/** DAK source names used for dashboard widgets and quick-report links. */
export const DAK_SOURCE_WIDGETS = {
  CMO: "CMO",
  JAN_SUNWAI: "Jan Sunwai",
  MLA: "MLA",
  CHIEF_SECRETARY: "Chief Secretary",
  COURT: "Court",
} as const;

export type DakSourceWidgetKey = keyof typeof DAK_SOURCE_WIDGETS;

export const DAK_SOURCE_CATEGORIES = [
  "executive",
  "elected",
  "public",
  "legal",
  "administrative",
  "digital",
  "general",
] as const;

export type DakSourceCategory = (typeof DAK_SOURCE_CATEGORIES)[number];
