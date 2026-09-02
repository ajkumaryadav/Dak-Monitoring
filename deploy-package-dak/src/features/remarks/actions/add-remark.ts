"use server";

import { revalidatePath } from "next/cache";

import { logWorkflowAction } from "@/features/dak/services/log-workflow";
import { getRemarkTypeLabel } from "@/features/remarks/lib/remark-types";
import { getRemarkPermissions } from "@/features/remarks/lib/remark-permissions";
import {
  addRemarkSchema,
  type AddRemarkInput,
} from "@/features/remarks/schemas/remark-schema";
import { notifyRemarkAdded } from "@/features/remarks/services/notify-remark-event";
import { PERMISSIONS, hasPermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/session";

export type AddRemarkResult =
  | { success: true }
  | { success: false; message: string };

export type AddRemarkFormState = {
  message?: string;
  success?: boolean;
};

function canAddRemarkType(
  perms: ReturnType<typeof getRemarkPermissions>,
  remarkType: AddRemarkInput["remarkType"]
): boolean {
  return perms.allowedRemarkTypes.includes(remarkType);
}

export async function addDakRemark(
  input: AddRemarkInput
): Promise<AddRemarkResult> {
  try {
    const user = await getSessionUser();
    if (!user || !hasPermission(user.role, PERMISSIONS.DAK_VIEW)) {
      return { success: false, message: "You do not have permission to add remarks." };
    }

    const perms = getRemarkPermissions(user);
    if (perms.isReadOnly) {
      return { success: false, message: "Your role cannot add remarks." };
    }

    const parsed = addRemarkSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid remark",
      };
    }

    if (!canAddRemarkType(perms, parsed.data.remarkType)) {
      return { success: false, message: "You cannot add this type of remark." };
    }

    const supabase = createAdminClient();

    const { data: dak, error: dakError } = await supabase
      .from("dak_entries")
      .select("id, dak_number")
      .eq("id", parsed.data.dakId)
      .maybeSingle();

    if (dakError || !dak) {
      return { success: false, message: "DAK entry not found." };
    }

    const isInternal =
      parsed.data.remarkType === "internal_note" ||
      parsed.data.remarkType === "collector_note";

    const { error } = await supabase.from("dak_remarks").insert({
      dak_id: parsed.data.dakId,
      remark_type: parsed.data.remarkType,
      body: parsed.data.body,
      created_by: user.id,
      is_internal: isInternal,
    });

    if (error) {
      return { success: false, message: error.message ?? "Failed to save remark." };
    }

    const label = getRemarkTypeLabel(parsed.data.remarkType);

    await logWorkflowAction({
      dakId: parsed.data.dakId,
      userId: user.id,
      eventType: "remarks_added",
      timelineActionType: "remark_added",
      action: `${label} added`,
      remarks: parsed.data.body,
      metadata: { remark_type: parsed.data.remarkType },
    });

    await notifyRemarkAdded({
      dakId: parsed.data.dakId,
      dakNumber: dak.dak_number as string,
      remarkType: parsed.data.remarkType,
      actorUserId: user.id,
      actorName: user.name,
    });

    revalidatePath(`/dashboard/dak/${parsed.data.dakId}`);
    return { success: true };
  } catch (error) {
    console.error("[addDakRemark]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

export async function addRemarkFormAction(
  _prev: AddRemarkFormState,
  formData: FormData
): Promise<AddRemarkFormState> {
  const result = await addDakRemark({
    dakId: formData.get("dakId") as string,
    remarkType: formData.get("remarkType") as AddRemarkInput["remarkType"],
    body: formData.get("body") as string,
  });

  if (!result.success) {
    return { message: result.message };
  }

  return { success: true };
}
