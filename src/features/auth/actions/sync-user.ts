"use server";

import { createAdminClient } from "@/lib/db/admin";
import { createClient } from "@/lib/db/client";

const DEFAULT_ROLE_SLUG = "dak_operator";

/**
 * Sync authenticated user → public.users after login.
 */
export async function syncUserProfile(): Promise<void> {
  try {
    const client = await createClient();

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user?.email) {
      return;
    }

    const admin = createAdminClient();

    // Check if profile exists by ID or email
    let existingProfile: any = null;
    const { data: byId } = await admin
      .from("users")
      .select("id, role_id, email")
      .eq("id", user.id)
      .maybeSingle();

    existingProfile = byId;

    if (!existingProfile) {
      const { data: byEmail } = await admin
        .from("users")
        .select("id, role_id, email")
        .eq("email", user.email)
        .maybeSingle();
      existingProfile = byEmail;
    }

    let roleId = existingProfile?.role_id;

    if (!roleId) {
      const { data: defaultRole } = await admin
        .from("roles")
        .select("id")
        .eq("slug", DEFAULT_ROLE_SLUG)
        .maybeSingle();

      roleId = defaultRole?.id;
    }

    const displayName =
      (user.user_metadata?.name as string | undefined) ??
      user.email.split("@")[0] ??
      "User";

    if (existingProfile) {
      await admin
        .from("users")
        .update({
          name: displayName,
          is_active: true,
          last_login: new Date().toISOString(),
        })
        .eq("id", existingProfile.id);
    } else if (roleId) {
      await admin.from("users").insert({
        id: user.id,
        email: user.email,
        name: displayName,
        role_id: roleId,
        is_active: true,
        last_login: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.warn("[syncUserProfile] non-fatal warning:", err?.message);
  }
}
