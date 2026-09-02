import { createAdminClient } from "@/lib/supabase/admin";

export interface AssignmentOfficerOption {
  id: string;
  name: string;
  departmentId: string | null;
  sectionId: string | null;
}

/** Active users eligible for department or section assignment dropdowns. */
export async function getAssignmentOfficers(): Promise<AssignmentOfficerOption[]> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("users")
      .select("id, name, department_id, section_id")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[getAssignmentOfficers]", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      departmentId: (row.department_id as string | null) ?? null,
      sectionId: (row.section_id as string | null) ?? null,
    }));
  } catch (error) {
    console.error("[getAssignmentOfficers]", error);
    return [];
  }
}

/** Officers mapped to a specific department. */
export async function getOfficersByDepartment(
  departmentId: string
): Promise<AssignmentOfficerOption[]> {
  const officers = await getAssignmentOfficers();
  return officers.filter((o) => o.departmentId === departmentId);
}

/** Officers mapped to a specific internal section. */
export async function getOfficersBySection(
  sectionId: string
): Promise<AssignmentOfficerOption[]> {
  const officers = await getAssignmentOfficers();
  return officers.filter((o) => o.sectionId === sectionId);
}
