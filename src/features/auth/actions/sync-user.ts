"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_ROLE_SLUG = "data_entry_operator";

/**
 * Sync auth.users → public.users after login.
 * Uses service role so profile creation works before RLS insert policies exist.
 */
export async function syncUserProfile(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return;
  }

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from("users")
    .select("id, role_id")
    .eq("id", user.id)
    .maybeSingle();

  let roleId = existingProfile?.role_id;

  if (!roleId) {
    const { data: defaultRole } = await admin
      .from("roles")
      .select("id")
      .eq("slug", DEFAULT_ROLE_SLUG)
      .maybeSingle();

    roleId = defaultRole?.id;
  }

  if (!roleId) {
    console.error("syncUserProfile: default role not found in roles table");
    return;
  }

  const displayName =
    (user.user_metadata?.name as string | undefined) ??
    user.email.split("@")[0] ??
    "User";

  const { error } = await admin.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      name: displayName,
      role_id: roleId,
      is_active: true,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("syncUserProfile failed:", error.message);
  }
}
