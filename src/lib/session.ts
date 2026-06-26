import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { SessionUser, UserRole } from "@/types";

const roleSlugMap: Record<string, UserRole> = {
  collector: "collector",
  adm: "adm",
  district_officer: "district_officer",
  block_officer: "block_officer",
  clerk: "clerk",
  data_entry_operator: "data_entry_operator",
};

function mapRoleSlug(slug: string | undefined): UserRole {
  if (slug && slug in roleSlugMap) {
    return roleSlugMap[slug];
  }
  return "clerk";
}

/** Load the authenticated user profile for the admin shell. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, designation, roles(slug, name)")
    .eq("id", user.id)
    .maybeSingle();

  const roleRecord = profile?.roles;
  const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;

  return {
    name: profile?.name ?? user.user_metadata?.name ?? "User",
    email: profile?.email ?? user.email ?? "",
    role: mapRoleSlug(roleData?.slug),
    designation: profile?.designation ?? roleData?.name ?? "Officer",
  };
}

/** Require an authenticated session or redirect to login. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
