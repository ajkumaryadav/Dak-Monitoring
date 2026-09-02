import { createAdminClient } from "@/lib/supabase/admin";

export interface DepartmentOption {
  id: string;
  name: string;
}

/** Load active departments alphabetically for DAK forms and filters. */
export async function getDepartments(): Promise<DepartmentOption[]> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("departments")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

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
