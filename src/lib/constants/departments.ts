/** District departments available for DAK allocation. */
export const DEPARTMENTS = [
  "Collectorate",
  "General Administration",
  "Revenue",
  "Development",
  "Panchayat Raj",
  "Education",
  "Health",
  "Agriculture",
  "Social Welfare",
  "Police (District)",
] as const;

export type Department = (typeof DEPARTMENTS)[number];
