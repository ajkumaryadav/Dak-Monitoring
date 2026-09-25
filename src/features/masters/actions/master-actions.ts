"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canManageMasters } from "@/features/masters/lib/permissions";
import {
  departmentFormSchema,
  sectionFormSchema,
} from "@/features/masters/schemas/master-schema";
import {
  createDepartment,
  createSection,
  deleteDepartment,
  deleteSection,
  reorderDepartments,
  setDepartmentActive,
  setSectionActive,
  updateDepartment,
  updateSection,
} from "@/features/masters/services/master-service";
import { getSessionUser } from "@/lib/session";
import { formatSafeErrorMessage, logSafeError } from "@/lib/security/errors";

function revalidateMasters() {
  revalidatePath("/dashboard/admin/masters");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/users/new");
  revalidatePath("/dashboard/dak");
  revalidatePath("/dashboard/dak/new");
  revalidatePath("/dashboard/dak/assignments");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
}

async function requireMasterActor() {
  const user = await getSessionUser();
  if (!user || !canManageMasters(user.role)) return null;
  return user;
}

export async function createDepartmentAction(input: unknown) {
  try {
    const user = await requireMasterActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const parsed = departmentFormSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        message: parsed.error.issues[0]?.message ?? "Invalid form input",
      };
    }
    const result = await createDepartment({
      ...parsed.data,
      actorId: user.id,
      actorRole: user.role,
    });
    if (result.success) revalidateMasters();
    return result;
  } catch (err: unknown) {
    logSafeError("createDepartmentAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to create department.") };
  }
}

export async function updateDepartmentAction(id: string, input: unknown) {
  try {
    const user = await requireMasterActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid department ID").safeParse(id);
    if (!validId.success) {
      return { success: false as const, message: "Invalid department identifier." };
    }
    const parsed = departmentFormSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        message: parsed.error.issues[0]?.message ?? "Invalid form input",
      };
    }
    const result = await updateDepartment({
      id,
      ...parsed.data,
      actorId: user.id,
      actorRole: user.role,
    });
    if (result.success) revalidateMasters();
    return result;
  } catch (err: unknown) {
    logSafeError("updateDepartmentAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to update department.") };
  }
}

export async function toggleDepartmentActiveAction(
  id: string,
  isActive: boolean
) {
  try {
    const user = await requireMasterActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid department ID").safeParse(id);
    if (!validId.success) {
      return { success: false as const, message: "Invalid department identifier." };
    }
    const result = await setDepartmentActive({
      id,
      isActive: Boolean(isActive),
      actorId: user.id,
      actorRole: user.role,
    });
    if (result.success) revalidateMasters();
    return result;
  } catch (err: unknown) {
    logSafeError("toggleDepartmentActiveAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to update department status.") };
  }
}

export async function deleteDepartmentAction(id: string) {
  try {
    const user = await requireMasterActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid department ID").safeParse(id);
    if (!validId.success) {
      return { success: false as const, message: "Invalid department identifier." };
    }
    const result = await deleteDepartment({
      id,
      actorId: user.id,
      actorRole: user.role,
    });
    if (result.success) revalidateMasters();
    return result;
  } catch (err: unknown) {
    logSafeError("deleteDepartmentAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to delete department.") };
  }
}

export async function reorderDepartmentsAction(orderedIds: string[]) {
  try {
    const user = await requireMasterActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const parsed = z
      .array(z.string().uuid())
      .max(200, "Too many items")
      .safeParse(orderedIds);
    if (!parsed.success) {
      return { success: false as const, message: "Invalid list of IDs." };
    }
    const result = await reorderDepartments({
      orderedIds: parsed.data,
      actorId: user.id,
      actorRole: user.role,
    });
    if (result.success) revalidateMasters();
    return result;
  } catch (err: unknown) {
    logSafeError("reorderDepartmentsAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to reorder departments.") };
  }
}

export async function createSectionAction(input: unknown) {
  try {
    const user = await requireMasterActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const parsed = sectionFormSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        message: parsed.error.issues[0]?.message ?? "Invalid form input",
      };
    }
    const result = await createSection({
      ...parsed.data,
      actorId: user.id,
      actorRole: user.role,
    });
    if (result.success) revalidateMasters();
    return result;
  } catch (err: unknown) {
    logSafeError("createSectionAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to create section.") };
  }
}

export async function updateSectionAction(id: string, input: unknown) {
  try {
    const user = await requireMasterActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid section ID").safeParse(id);
    if (!validId.success) {
      return { success: false as const, message: "Invalid section identifier." };
    }
    const parsed = sectionFormSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        message: parsed.error.issues[0]?.message ?? "Invalid form input",
      };
    }
    const result = await updateSection({
      id,
      ...parsed.data,
      actorId: user.id,
      actorRole: user.role,
    });
    if (result.success) revalidateMasters();
    return result;
  } catch (err: unknown) {
    logSafeError("updateSectionAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to update section.") };
  }
}

export async function toggleSectionActiveAction(id: string, isActive: boolean) {
  try {
    const user = await requireMasterActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid section ID").safeParse(id);
    if (!validId.success) {
      return { success: false as const, message: "Invalid section identifier." };
    }
    const result = await setSectionActive({
      id,
      isActive: Boolean(isActive),
      actorId: user.id,
      actorRole: user.role,
    });
    if (result.success) revalidateMasters();
    return result;
  } catch (err: unknown) {
    logSafeError("toggleSectionActiveAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to update section status.") };
  }
}

export async function deleteSectionAction(id: string) {
  try {
    const user = await requireMasterActor();
    if (!user) return { success: false as const, message: "Unauthorized." };
    const validId = z.string().uuid("Invalid section ID").safeParse(id);
    if (!validId.success) {
      return { success: false as const, message: "Invalid section identifier." };
    }
    const result = await deleteSection({
      id,
      actorId: user.id,
      actorRole: user.role,
    });
    if (result.success) revalidateMasters();
    return result;
  } catch (err: unknown) {
    logSafeError("deleteSectionAction", err);
    return { success: false as const, message: formatSafeErrorMessage(err, "Failed to delete section.") };
  }
}
