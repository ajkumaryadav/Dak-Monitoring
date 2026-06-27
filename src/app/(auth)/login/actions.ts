"use server";

import { redirect } from "next/navigation";

import { syncUserProfile } from "@/features/auth/actions/sync-user";
import { createActivityLog } from "@/features/activity/services/activity-log";
import { loginSchema } from "@/features/auth/schemas/login-schema";
import { createClient } from "@/lib/supabase/server";

export type LoginFormState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
};

/** Sign in with Supabase email/password, sync profile, redirect to dashboard. */
export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { message: error.message };
  }

  await syncUserProfile();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser) {
    await createActivityLog({
      userId: authUser.id,
      action: "Login",
      module: "auth",
      description: `Signed in as ${parsed.data.email}`,
    });
  }

  redirect("/dashboard");
}
