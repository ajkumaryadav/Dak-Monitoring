import { createAdminClient } from "@/lib/supabase/admin";

export interface DepartmentOption {
  id: string;
  name: string;
}

const DEFAULT_DEPARTMENTS = [
  "Collectorate",
  "General Administration",
  "Revenue",
  "Development",
  "Panchayat Raj",
  "Education",
  "Health",
  "Agriculture",
  "Social Welfare",
  "Police (District)",
] as const;

async function seedDepartmentsIfEmpty() {
  const supabase = createAdminClient();

  const rows = DEFAULT_DEPARTMENTS.map((name) => ({
    name,
    is_active: true,
  }));

  await supabase.from("departments").insert(rows);
}

/** Load active departments for DAK forms and filters. */
export async function getDepartments(): Promise<DepartmentOption[]> {
  try {
    const supabase = createAdminClient();

    let { data, error } = await supabase
      .from("departments")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("[getDepartments]", error.message);
      return [];
    }

    if (!data?.length) {
      await seedDepartmentsIfEmpty();

      const retry = await supabase
        .from("departments")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[getDepartments]", error.message);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error("[getDepartments]", error);
    return [];
  }
}
