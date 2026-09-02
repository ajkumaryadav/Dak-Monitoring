import type { UserRole } from "@/types";

/** Map DB role slugs to canonical app roles (includes legacy aliases). */
const roleSlugMap: Record<string, UserRole> = {
  collector: "collector",
  acp: "acp",
  adm: "adm",
  dak_operator: "dak_operator",
  department_user: "department_user",
  section_user: "section_user",
  district_officer: "department_user",
  block_officer: "department_user",
  clerk: "department_user",
  data_entry_operator: "dak_operator",
};

export function mapRoleSlug(slug: string | undefined): UserRole {
  if (slug && slug in roleSlugMap) {
    return roleSlugMap[slug];
  }
  return "dak_operator";
}

export function readRoleSlugFromProfile(
  roleRecord: { slug?: string } | { slug?: string }[] | null | undefined
): UserRole {
  const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;
  return mapRoleSlug(roleData?.slug);
}
