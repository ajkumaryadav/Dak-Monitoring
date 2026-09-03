import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types";

export interface RoleOption {
  id: string;
  slug: UserRole | string;
  name: string;
}

export interface UserListRecord {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  designation: string | null;
  employeeCode: string | null;
  isActive: boolean;
  departmentId: string | null;
  sectionId: string | null;
  roleSlug: string;
  roleName: string;
  departmentName: string | null;
  sectionName: string | null;
  lastLogin: string | null;
  createdAt: string | null;
}

export interface UserDetailRecord extends UserListRecord {
  createdBy: string | null;
}

export interface UserStatsSummary {
  total: number;
  active: number;
  disabled: number;
}

const USER_SELECT = `
  id,
  name,
  email,
  mobile,
  designation,
  employee_code,
  is_active,
  department_id,
  section_id,
  last_login,
  created_at,
  created_by,
  roles(slug, name),
  departments(name),
  assignment_units:assignment_units(unit_name)
`;

function mapUserRow(row: Record<string, unknown>): UserListRecord {
  const roleRecord = row.roles;
  const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;
  const deptRecord = row.departments;
  const deptData = Array.isArray(deptRecord) ? deptRecord[0] : deptRecord;
  const sectionRecord = row.assignment_units;
  const sectionData = Array.isArray(sectionRecord)
    ? sectionRecord[0]
    : sectionRecord;

  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    mobile: (row.mobile as string | null) ?? null,
    designation: (row.designation as string | null) ?? null,
    employeeCode: (row.employee_code as string | null) ?? null,
    isActive: row.is_active !== false,
    departmentId: (row.department_id as string | null) ?? null,
    sectionId: (row.section_id as string | null) ?? null,
    roleSlug: (roleData as { slug?: string } | undefined)?.slug ?? "",
    roleName: (roleData as { name?: string } | undefined)?.name ?? "",
    departmentName: (deptData as { name?: string } | undefined)?.name ?? null,
    sectionName:
      (sectionData as { unit_name?: string } | undefined)?.unit_name ?? null,
    lastLogin: (row.last_login as string | null) ?? null,
    createdAt: (row.created_at as string | null) ?? null,
  };
}

export async function getRoles(): Promise<RoleOption[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, slug, name")
    .in("slug", [
      "collector",
      "acp",
      "adm",
      "dak_operator",
      "department_user",
      "section_user",
    ])
    .order("name");

  if (error) {
    console.error("[getRoles]", error.message);
    return [];
  }

  return (data ?? []) as RoleOption[];
}

export async function getRoleIdBySlug(slug: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("roles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return (data?.id as string | undefined) ?? null;
}

export async function getUsersList(): Promise<UserListRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .order("name", { ascending: true });

  if (error) {
    console.error("[getUsersList]", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapUserRow(row as Record<string, unknown>)
  );
}

export async function getUserById(
  userId: string
): Promise<UserDetailRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    console.error("[getUserById]", error?.message);
    return null;
  }

  const mapped = mapUserRow(data as Record<string, unknown>);
  return {
    ...mapped,
    createdBy: (data.created_by as string | null) ?? null,
  };
}

export async function getUserStats(): Promise<UserStatsSummary> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("users").select("is_active");

  if (error) {
    console.error("[getUserStats]", error.message);
    return { total: 0, active: 0, disabled: 0 };
  }

  const rows = data ?? [];
  const active = rows.filter((r) => r.is_active !== false).length;

  return {
    total: rows.length,
    active,
    disabled: rows.length - active,
  };
}
