"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  designation: z.string().trim().min(2, "Designation must be at least 2 characters"),
});

export type UpdateProfileState = {
  message?: string;
  success?: boolean;
  errors?: {
    name?: string[];
    designation?: string[];
  };
};

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const user = await requireSessionUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    designation: formData.get("designation"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      name: parsed.data.name,
      designation: parsed.data.designation,
    })
    .eq("id", user.id);

  if (error) {
    return { message: "Unable to update profile. Please try again." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");

  return { success: true, message: "Profile updated successfully." };
}
