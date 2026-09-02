import { createAdminClient } from "@/lib/supabase/admin";

export interface AssignmentUnitOption {
  id: string;
  unit_name: string;
  unit_type: "department" | "section";
}

/** Load active assignment units from the database (master-managed). */
export async function getAssignmentUnits(
  unitType: "section" | "department" = "section"
): Promise<AssignmentUnitOption[]> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("assignment_units")
      .select("id, unit_name, unit_type")
      .eq("is_active", true)
      .eq("unit_type", unitType)
      .order("unit_name", { ascending: true });

    if (error) {
      console.error("[getAssignmentUnits]", error.message);
      return [];
    }

    return (data ?? []) as AssignmentUnitOption[];
  } catch (error) {
    console.error("[getAssignmentUnits]", error);
    return [];
  }
}
