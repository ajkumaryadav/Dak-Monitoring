import { redirect } from "next/navigation";

import { getPermissionsForRole } from "@/lib/auth/permissions";
import { mapRoleSlug } from "@/lib/auth/role-slug";
import { createClient } from "@/lib/db/client";
import type { SessionUser } from "@/types";

/** Load the authenticated user profile for the admin shell. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const db = await createClient();

    const {
      data: { user },
    } = await db.auth.getUser();

    if (!user) {
      return null;
    }

    let profile: {
      name?: string;
      email?: string;
      designation?: string;
      role_id?: string;
      department_id?: string | null;
      section_id?: string | null;
      mobile?: string | null;
      employee_code?: string | null;
      is_active?: boolean;
      roles?: { slug?: string; name?: string } | { slug?: string; name?: string }[];
    } | null = null;

    try {
      const { data } = await db
        .from("users")
        .select(
          "name, email, designation, role_id, department_id, section_id, mobile, employee_code, is_active, roles(slug, name)"
        )
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    } catch (profileErr) {
      console.warn("[getSessionUser] Profile query warning:", profileErr);
    }

    if (profile && profile.is_active === false) {
      return null;
    }

    const roleRecord = profile?.roles;
    const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;
    const tokenRole = user.user_metadata?.role;
    const isCollectorEmail = user.email?.toLowerCase().includes("collector") || user.email?.toLowerCase().includes("admin");
    const roleSlug =
      tokenRole ||
      (roleData?.slug as string | undefined) ||
      (isCollectorEmail ? "collector" : "collector");
    const role = mapRoleSlug(roleSlug);

    return {
      id: user.id,
      name: profile?.name ?? (user.user_metadata?.name as string) ?? (role === "collector" ? "District Collector" : "District Officer"),
      email: profile?.email ?? user.email ?? "",
      role,
      roleSlug,
      designation: profile?.designation ?? roleData?.name ?? (role === "collector" ? "District Collector & Magistrate" : "Officer"),
      departmentId: (profile?.department_id as string | null) ?? null,
      sectionId: (profile?.section_id as string | null) ?? null,
      mobile: (profile?.mobile as string | null) ?? null,
      employeeCode: (profile?.employee_code as string | null) ?? null,
      isActive: profile?.is_active !== false,
      permissions: [...getPermissionsForRole(role)],
    };
  } catch (err) {
    console.error("[getSessionUser] Unexpected error:", err);
    return null;
  }
}

/** Require an authenticated session or redirect to login. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
