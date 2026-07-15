"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canMoveDakToRecycleBin } from "@/features/system-admin/lib/permissions";
import { moveDakToRecycleBin } from "@/features/system-admin/services/recycle-bin";
import { getSessionUser } from "@/lib/session";

export type MoveToRecycleBinState = {
  success?: boolean;
  message?: string;
};

/** Soft-delete from DAK Details → Recycle Bin (Collector / ACP). */
export async function moveDakToRecycleBinAction(
  dakId: string
): Promise<MoveToRecycleBinState> {
  const user = await getSessionUser();
  if (!user || !canMoveDakToRecycleBin(user.role)) {
    return {
      success: false,
      message: "Only Collector or ACP can move DAK to Recycle Bin.",
    };
  }

  const result = await moveDakToRecycleBin({
    dakId,
    userId: user.id,
    role: user.role,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  revalidatePath("/dashboard/dak");
  revalidatePath(`/dashboard/dak/${dakId}`);
  revalidatePath("/dashboard/admin/database-storage");
  revalidatePath("/dashboard");
  redirect("/dashboard/admin/database-storage?tab=recycle");
}
