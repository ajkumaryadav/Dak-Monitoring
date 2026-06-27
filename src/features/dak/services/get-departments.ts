import { createAdminClient } from "@/lib/supabase/admin";
import { DISTRICT_DEPARTMENTS } from "@/lib/constants/departments";

export interface DepartmentOption {
  id: string;
  name: string;
}

async function seedDepartmentsIfEmpty() {
  const supabase = createAdminClient();

  const rows = DISTRICT_DEPARTMENTS.map((name) => ({
    name,
    is_active: true,
  }));

  await supabase.from("departments").insert(rows);
}

/** Load active departments alphabetically for DAK forms and filters. */
export async function getDepartments(): Promise<DepartmentOption[]> {
  try {
    const supabase = createAdminClient();

    let { data, error } = await supabase
      .from("departments")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

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
        .order("name", { ascending: true });

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[getDepartments]", error.message);
      return [];
    }

    return (data ?? []).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  } catch (error) {
    console.error("[getDepartments]", error);
    return [];
  }
}
