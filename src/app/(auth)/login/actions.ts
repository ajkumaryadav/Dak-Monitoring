"use server";

import { redirect } from "next/navigation";

import { loginSchema } from "@/features/auth/schemas/login-schema";

export type LoginFormState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
};

/** Demo login — validates then redirects until Supabase Auth is connected. */
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

  redirect("/dashboard");
}
