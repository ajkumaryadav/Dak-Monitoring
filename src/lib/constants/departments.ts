/** District departments — always sorted alphabetically when loaded. */
export const DISTRICT_DEPARTMENTS = [
  "BIDA",
  "Collectorate",
  "Devsthan",
  "DOIT&C",
  "Food & Supply",
  "Home",
  "Irrigation",
  "JVVNL",
  "LSG",
  "Medical & Health",
  "Minority",
  "PHED",
  "Police",
  "Pollution Control",
  "PWD",
  "Revenue",
  "Rural Development",
  "SJE",
  "Statistics",
  "Transport",
  "Treasury",
  "Watershed",
] as const;

export type DistrictDepartmentName = (typeof DISTRICT_DEPARTMENTS)[number];

/** Internal Collectorate sections for section-level assignment. */
export const INTERNAL_SECTIONS = [
  "Establishment",
  "Accounts",
  "General Administration",
  "Nazarat",
  "Legal",
  "Confidential",
  "Election",
  "Disaster Management",
  "Store",
  "Record Room",
  "Planning",
  "Development",
  "PA Cell",
  "General",
  "LR",
  "Court",
  "RTI",
  "Panchayati Raj",
  "ADM",
  "ACEM",
  "PRO",
  "Revenue",
  "Receipt / Dispatch",
] as const;

export type InternalSectionName = (typeof INTERNAL_SECTIONS)[number];
