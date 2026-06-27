"use server";

import { redirect } from "next/navigation";

import { createActivityLog } from "@/features/activity/services/activity-log";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/session";

/** Sign out the current user and redirect to home. */
export async function logoutAction() {
  const user = await getSessionUser();

  if (user) {
    await createActivityLog({
      userId: user.id,
      action: "Logout",
      module: "auth",
      description: `${user.name} signed out`,
    });
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/");
}
