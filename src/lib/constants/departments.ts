/** District departments — always sorted alphabetically when loaded. */
export const DISTRICT_DEPARTMENTS = [
  "BIDA",
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
  "Development",
  "Accounts",
  "PA Cell",
  "General",
  "LR",
  "Court",
  "Legal",
  "RTI",
  "Panchayati Raj",
  "ADM",
  "Store",
  "ACEM",
] as const;

export type InternalSectionName = (typeof INTERNAL_SECTIONS)[number];
