import { createAdminClient } from "@/lib/supabase/admin";

export interface DepartmentOfficerOption {
  departmentId: string;
  departmentName: string;
  officerId: string | null;
  officerName: string | null;
  displayLabel: string;
}

const OFFICER_ROLES = [
  "department_user",
  "section_user",
  "adm",
  "dak_operator",
  "district_officer",
  "block_officer",
  "clerk",
] as const;

function formatDisplayLabel(
  departmentName: string,
  officerName: string | null
): string {
  return `${departmentName} — ${officerName ?? "Not Assigned"}`;
}

/** Map departments to their primary assigned officer for assignment dropdowns. */
export async function getDepartmentOfficers(): Promise<DepartmentOfficerOption[]> {
  try {
    const supabase = createAdminClient();

    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (deptError || !departments?.length) {
      console.error("[getDepartmentOfficers]", deptError?.message);
      return [];
    }

    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, name, department_id, is_active, roles(slug)")
      .eq("is_active", true)
      .not("department_id", "is", null);

    if (userError) {
      console.error("[getDepartmentOfficers]", userError.message);
    }

    const officersByDept = new Map<string, { id: string; name: string }>();

    for (const user of users ?? []) {
      const deptId = user.department_id as string | null;
      if (!deptId || officersByDept.has(deptId)) continue;

      const roleRecord = user.roles;
      const roleData = Array.isArray(roleRecord) ? roleRecord[0] : roleRecord;
      const slug = roleData?.slug as string | undefined;

      if (slug && OFFICER_ROLES.includes(slug as (typeof OFFICER_ROLES)[number])) {
        officersByDept.set(deptId, {
          id: user.id as string,
          name: user.name as string,
        });
      }
    }

    return departments
      .map((dept) => {
        const officer = officersByDept.get(dept.id as string);
        const departmentName = dept.name as string;

        return {
          departmentId: dept.id as string,
          departmentName,
          officerId: officer?.id ?? null,
          officerName: officer?.name ?? null,
          displayLabel: formatDisplayLabel(departmentName, officer?.name ?? null),
        };
      })
      .sort((a, b) =>
        a.departmentName.localeCompare(b.departmentName, undefined, {
          sensitivity: "base",
        })
      );
  } catch (error) {
    console.error("[getDepartmentOfficers]", error);
    return [];
  }
}

/** Resolve officer id for a department when assigning. */
export async function getOfficerIdForDepartment(
  departmentId: string
): Promise<string | null> {
  const options = await getDepartmentOfficers();
  return (
    options.find((option) => option.departmentId === departmentId)?.officerId ??
    null
  );
}
