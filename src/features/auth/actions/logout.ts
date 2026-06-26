"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Sign out the current user and redirect to login. */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
