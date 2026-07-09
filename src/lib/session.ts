import { redirect } from "next/navigation";

import { getPermissionsForRole } from "@/lib/auth/permissions";
import { mapRoleSlug } from "@/lib/auth/role-slug";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types";

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
    .select(
      "name, email, designation, role_id, department_id, section_id, mobile, employee_code, is_active, roles(slug, name)"
    )
    .eq("id", user.id)
    .maybeSingle();

  const roleRecord = profile?.roles;
  const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;
  const role = mapRoleSlug(roleData?.slug as string | undefined);

  return {
    id: user.id,
    name: profile?.name ?? (user.user_metadata?.name as string) ?? "User",
    email: profile?.email ?? user.email ?? "",
    role,
    roleSlug: roleData?.slug ?? role,
    designation: profile?.designation ?? roleData?.name ?? "Officer",
    departmentId: (profile?.department_id as string | null) ?? null,
    sectionId: (profile?.section_id as string | null) ?? null,
    mobile: (profile?.mobile as string | null) ?? null,
    employeeCode: (profile?.employee_code as string | null) ?? null,
    isActive: profile?.is_active !== false,
    permissions: [...getPermissionsForRole(role)],
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
