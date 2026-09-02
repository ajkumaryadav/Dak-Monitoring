import { createAdminClient } from "@/lib/supabase/admin";
import { logMasterDataChange } from "@/features/masters/services/master-audit";

export interface DepartmentMasterRow {
  id: string;
  name: string;
  shortName: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string | null;
  userCount: number;
  dakCount: number;
  canDelete: boolean;
}

export interface SectionMasterRow {
  id: string;
  unitName: string;
  departmentId: string | null;
  departmentName: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string | null;
  userCount: number;
  dakCount: number;
  canDelete: boolean;
}

export async function listDepartmentsMaster(
  includeInactive = true
): Promise<DepartmentMasterRow[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("departments")
    .select(
      "id, name, short_name, description, is_active, sort_order, updated_at"
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[listDepartmentsMaster]", error.message);
    return [];
  }

  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  if (!ids.length) return [];

  const [{ data: users }, { data: daks }] = await Promise.all([
    supabase.from("users").select("department_id").in("department_id", ids),
    supabase
      .from("dak_entries")
      .select("department_id")
      .in("department_id", ids)
      .is("deleted_at", null),
  ]);

  const userCounts = new Map<string, number>();
  for (const u of users ?? []) {
    const id = u.department_id as string;
    userCounts.set(id, (userCounts.get(id) ?? 0) + 1);
  }
  const dakCounts = new Map<string, number>();
  for (const d of daks ?? []) {
    const id = d.department_id as string;
    dakCounts.set(id, (dakCounts.get(id) ?? 0) + 1);
  }

  return rows.map((row) => {
    const id = row.id as string;
    const userCount = userCounts.get(id) ?? 0;
    const dakCount = dakCounts.get(id) ?? 0;
    return {
      id,
      name: row.name as string,
      shortName: (row.short_name as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      isActive: Boolean(row.is_active),
      sortOrder: Number(row.sort_order ?? 0),
      updatedAt: (row.updated_at as string | null) ?? null,
      userCount,
      dakCount,
      canDelete: userCount === 0 && dakCount === 0,
    };
  });
}

export async function createDepartment(params: {
  name: string;
  shortName: string | null;
  description: string | null;
  isActive: boolean;
  actorId: string;
  actorRole: string;
}): Promise<{ success: true; id: string } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("departments")
    .insert({
      name: params.name,
      short_name: params.shortName,
      description: params.description,
      is_active: params.isActive,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      message: error.message.includes("uq_departments_name")
        ? "A department with this name already exists."
        : error.message,
    };
  }

  await logMasterDataChange({
    entityType: "department",
    entityId: data.id as string,
    action: "create",
    actorId: params.actorId,
    actorRole: params.actorRole,
    newValue: {
      name: params.name,
      shortName: params.shortName,
      description: params.description,
      isActive: params.isActive,
    },
  });

  return { success: true, id: data.id as string };
}

export async function updateDepartment(params: {
  id: string;
  name: string;
  shortName: string | null;
  description: string | null;
  isActive: boolean;
  actorId: string;
  actorRole: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("departments")
    .select("id, name, short_name, description, is_active")
    .eq("id", params.id)
    .maybeSingle();

  if (!existing) return { success: false, message: "Department not found." };

  const { error } = await supabase
    .from("departments")
    .update({
      name: params.name,
      short_name: params.shortName,
      description: params.description,
      is_active: params.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    return {
      success: false,
      message: error.message.includes("uq_departments_name")
        ? "A department with this name already exists."
        : error.message,
    };
  }

  await logMasterDataChange({
    entityType: "department",
    entityId: params.id,
    action: "update",
    actorId: params.actorId,
    actorRole: params.actorRole,
    previousValue: existing as Record<string, unknown>,
    newValue: {
      name: params.name,
      shortName: params.shortName,
      description: params.description,
      isActive: params.isActive,
    },
  });

  return { success: true };
}

export async function setDepartmentActive(params: {
  id: string;
  isActive: boolean;
  actorId: string;
  actorRole: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("departments")
    .select("id, name, is_active")
    .eq("id", params.id)
    .maybeSingle();

  if (!existing) return { success: false, message: "Department not found." };

  const { error } = await supabase
    .from("departments")
    .update({
      is_active: params.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) return { success: false, message: error.message };

  await logMasterDataChange({
    entityType: "department",
    entityId: params.id,
    action: params.isActive ? "activate" : "deactivate",
    actorId: params.actorId,
    actorRole: params.actorRole,
    previousValue: { is_active: existing.is_active },
    newValue: { is_active: params.isActive },
  });

  return { success: true };
}

export async function deleteDepartment(params: {
  id: string;
  actorId: string;
  actorRole: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  const rows = await listDepartmentsMaster(true);
  const row = rows.find((r) => r.id === params.id);
  if (!row) return { success: false, message: "Department not found." };
  if (!row.canDelete) {
    return {
      success: false,
      message:
        "Cannot delete: department has linked users or DAK. Deactivate instead.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("departments").delete().eq("id", params.id);
  if (error) return { success: false, message: error.message };

  await logMasterDataChange({
    entityType: "department",
    entityId: params.id,
    action: "delete",
    actorId: params.actorId,
    actorRole: params.actorRole,
    previousValue: { name: row.name },
  });

  return { success: true };
}

export async function reorderDepartments(params: {
  orderedIds: string[];
  actorId: string;
  actorRole: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = createAdminClient();
  for (let i = 0; i < params.orderedIds.length; i += 1) {
    const { error } = await supabase
      .from("departments")
      .update({
        sort_order: i + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.orderedIds[i]);
    if (error) return { success: false, message: error.message };
  }

  await logMasterDataChange({
    entityType: "department",
    entityId: null,
    action: "reorder",
    actorId: params.actorId,
    actorRole: params.actorRole,
    newValue: { orderedIds: params.orderedIds },
  });

  return { success: true };
}

export async function listSectionsMaster(
  includeInactive = true
): Promise<SectionMasterRow[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("assignment_units")
    .select(
      "id, unit_name, department_id, description, is_active, sort_order, updated_at, departments:department_id(name)"
    )
    .eq("unit_type", "section")
    .order("sort_order", { ascending: true })
    .order("unit_name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[listSectionsMaster]", error.message);
    return [];
  }

  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  if (!ids.length) return [];

  const [{ data: users }, { data: daks }] = await Promise.all([
    supabase.from("users").select("section_id").in("section_id", ids),
    supabase
      .from("dak_entries")
      .select("assignment_unit_id")
      .in("assignment_unit_id", ids)
      .is("deleted_at", null),
  ]);

  const userCounts = new Map<string, number>();
  for (const u of users ?? []) {
    const id = u.section_id as string;
    userCounts.set(id, (userCounts.get(id) ?? 0) + 1);
  }
  const dakCounts = new Map<string, number>();
  for (const d of daks ?? []) {
    const id = d.assignment_unit_id as string;
    dakCounts.set(id, (dakCounts.get(id) ?? 0) + 1);
  }

  return rows.map((row) => {
    const id = row.id as string;
    const dept = row.departments as
      | { name?: string }
      | { name?: string }[]
      | null;
    const departmentName = Array.isArray(dept)
      ? dept[0]?.name ?? null
      : dept?.name ?? null;
    const userCount = userCounts.get(id) ?? 0;
    const dakCount = dakCounts.get(id) ?? 0;
    return {
      id,
      unitName: row.unit_name as string,
      departmentId: (row.department_id as string | null) ?? null,
      departmentName,
      description: (row.description as string | null) ?? null,
      isActive: Boolean(row.is_active),
      sortOrder: Number(row.sort_order ?? 0),
      updatedAt: (row.updated_at as string | null) ?? null,
      userCount,
      dakCount,
      canDelete: userCount === 0 && dakCount === 0,
    };
  });
}

export async function createSection(params: {
  unitName: string;
  departmentId: string | null;
  description: string | null;
  isActive: boolean;
  actorId: string;
  actorRole: string;
}): Promise<{ success: true; id: string } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("assignment_units")
    .insert({
      unit_name: params.unitName,
      unit_type: "section",
      department_id: params.departmentId,
      description: params.description,
      is_active: params.isActive,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return {
      success: false,
      message: error.message.includes("unit_name")
        ? "A section with this name already exists."
        : error.message,
    };
  }

  await logMasterDataChange({
    entityType: "section",
    entityId: data.id as string,
    action: "create",
    actorId: params.actorId,
    actorRole: params.actorRole,
    newValue: {
      unitName: params.unitName,
      departmentId: params.departmentId,
      description: params.description,
      isActive: params.isActive,
    },
  });

  return { success: true, id: data.id as string };
}

export async function updateSection(params: {
  id: string;
  unitName: string;
  departmentId: string | null;
  description: string | null;
  isActive: boolean;
  actorId: string;
  actorRole: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("assignment_units")
    .select("id, unit_name, department_id, description, is_active")
    .eq("id", params.id)
    .maybeSingle();

  if (!existing) return { success: false, message: "Section not found." };

  const { error } = await supabase
    .from("assignment_units")
    .update({
      unit_name: params.unitName,
      department_id: params.departmentId,
      description: params.description,
      is_active: params.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    return {
      success: false,
      message: error.message.includes("unit_name")
        ? "A section with this name already exists."
        : error.message,
    };
  }

  await logMasterDataChange({
    entityType: "section",
    entityId: params.id,
    action: "update",
    actorId: params.actorId,
    actorRole: params.actorRole,
    previousValue: existing as Record<string, unknown>,
    newValue: {
      unitName: params.unitName,
      departmentId: params.departmentId,
      description: params.description,
      isActive: params.isActive,
    },
  });

  return { success: true };
}

export async function setSectionActive(params: {
  id: string;
  isActive: boolean;
  actorId: string;
  actorRole: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = createAdminClient();
  const { data: section } = await supabase
    .from("assignment_units")
    .select("id, unit_name, is_active")
    .eq("id", params.id)
    .maybeSingle();

  if (!section) return { success: false, message: "Section not found." };

  const { error } = await supabase
    .from("assignment_units")
    .update({
      is_active: params.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) return { success: false, message: error.message };

  await logMasterDataChange({
    entityType: "section",
    entityId: params.id,
    action: params.isActive ? "activate" : "deactivate",
    actorId: params.actorId,
    actorRole: params.actorRole,
    previousValue: { is_active: section.is_active },
    newValue: { is_active: params.isActive },
  });

  return { success: true };
}

export async function deleteSection(params: {
  id: string;
  actorId: string;
  actorRole: string;
}): Promise<{ success: true } | { success: false; message: string }> {
  const rows = await listSectionsMaster(true);
  const row = rows.find((r) => r.id === params.id);
  if (!row) return { success: false, message: "Section not found." };
  if (!row.canDelete) {
    return {
      success: false,
      message:
        "Cannot delete: section has linked users or DAK. Deactivate instead.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("assignment_units")
    .delete()
    .eq("id", params.id);

  if (error) return { success: false, message: error.message };

  await logMasterDataChange({
    entityType: "section",
    entityId: params.id,
    action: "delete",
    actorId: params.actorId,
    actorRole: params.actorRole,
    previousValue: { unitName: row.unitName },
  });

  return { success: true };
}
