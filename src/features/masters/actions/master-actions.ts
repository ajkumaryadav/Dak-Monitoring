"use server";

import { revalidatePath } from "next/cache";

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
  const user = await requireMasterActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const parsed = departmentFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Invalid form",
    };
  }
  const result = await createDepartment({
    ...parsed.data,
    actorId: user.id,
    actorRole: user.role,
  });
  if (result.success) revalidateMasters();
  return result;
}

export async function updateDepartmentAction(id: string, input: unknown) {
  const user = await requireMasterActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const parsed = departmentFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Invalid form",
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
}

export async function toggleDepartmentActiveAction(
  id: string,
  isActive: boolean
) {
  const user = await requireMasterActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await setDepartmentActive({
    id,
    isActive,
    actorId: user.id,
    actorRole: user.role,
  });
  if (result.success) revalidateMasters();
  return result;
}

export async function deleteDepartmentAction(id: string) {
  const user = await requireMasterActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await deleteDepartment({
    id,
    actorId: user.id,
    actorRole: user.role,
  });
  if (result.success) revalidateMasters();
  return result;
}

export async function reorderDepartmentsAction(orderedIds: string[]) {
  const user = await requireMasterActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await reorderDepartments({
    orderedIds,
    actorId: user.id,
    actorRole: user.role,
  });
  if (result.success) revalidateMasters();
  return result;
}

export async function createSectionAction(input: unknown) {
  const user = await requireMasterActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const parsed = sectionFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Invalid form",
    };
  }
  const result = await createSection({
    ...parsed.data,
    actorId: user.id,
    actorRole: user.role,
  });
  if (result.success) revalidateMasters();
  return result;
}

export async function updateSectionAction(id: string, input: unknown) {
  const user = await requireMasterActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const parsed = sectionFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Invalid form",
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
}

export async function toggleSectionActiveAction(id: string, isActive: boolean) {
  const user = await requireMasterActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await setSectionActive({
    id,
    isActive,
    actorId: user.id,
    actorRole: user.role,
  });
  if (result.success) revalidateMasters();
  return result;
}

export async function deleteSectionAction(id: string) {
  const user = await requireMasterActor();
  if (!user) return { success: false as const, message: "Unauthorized" };
  const result = await deleteSection({
    id,
    actorId: user.id,
    actorRole: user.role,
  });
  if (result.success) revalidateMasters();
  return result;
}
