"use server";

import { revalidatePath } from "next/cache";

import { changePasswordSchema } from "@/features/profile/schemas/change-password-schema";
import { requireSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type ChangePasswordState = {
  message?: string;
  success?: boolean;
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  };
};

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await requireSessionUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return {
      errors: { currentPassword: ["Current password is incorrect."] },
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return { message: "Unable to update password. Please try again." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");

  return { success: true, message: "Password changed successfully." };
}
