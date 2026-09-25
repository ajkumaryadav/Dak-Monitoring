"use server";

import { redirect } from "next/navigation";

import { syncUserProfile } from "@/features/auth/actions/sync-user";
import { createActivityLog } from "@/features/activity/services/activity-log";
import { loginSchema } from "@/features/auth/schemas/login-schema";
import { createClient } from "@/lib/db/client";
import { formatSafeErrorMessage, logSafeError } from "@/lib/security/errors";

export type LoginFormState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
};

/** Sign in with email/password, sync profile, redirect to dashboard. */
export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  try {
    let rawEmail = formData.get("email");
    let rawPassword =
      formData.get("credential") ||
      formData.get("auth_hash") ||
      formData.get("password");
    const rawEncrypted = formData.get("encrypted_payload");

    if (typeof rawEncrypted === "string" && rawEncrypted.trim().length > 0) {
      const { decryptCredentialsServer } = await import("@/lib/security/credential-crypto");
      const decrypted = decryptCredentialsServer(rawEncrypted.trim());
      if (decrypted) {
        if (decrypted.email) rawEmail = decrypted.email;
        if (decrypted.password) rawPassword = decrypted.password;
        else if (decrypted.credential) rawPassword = decrypted.credential;
        else if (decrypted.auth_hash) rawPassword = decrypted.auth_hash;
      }
    }

    const emailStr = typeof rawEmail === "string" ? rawEmail.trim() : "";
    const passwordStr = typeof rawPassword === "string" ? rawPassword : "";

    if (!emailStr || !passwordStr) {
      return { errors: { email: !emailStr ? ["Official email / username is required"] : undefined, password: !passwordStr ? ["Password is required"] : undefined } };
    }

    const parsed = loginSchema.safeParse({
      email: emailStr,
      password: passwordStr,
      credential: passwordStr,
    });

    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: emailStr,
      password: passwordStr,
    });

    if (error) {
      return { message: error.message || "Invalid credentials. Please try again." };
    }

    try {
      await syncUserProfile();
    } catch (syncErr: unknown) {
      console.warn("[Login] syncUserProfile non-fatal warning:", syncErr);
    }

    try {
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
    } catch (logErr: unknown) {
      console.warn("[Login] createActivityLog non-fatal warning:", logErr);
    }

    redirect("/dashboard");
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err && typeof (err as any).digest === "string" && (err as any).digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    logSafeError("loginAction", err);
    return { message: formatSafeErrorMessage(err, "Authentication failed. Please check your credentials.") };
  }
}
