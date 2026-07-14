import { createAdminClient } from "@/lib/supabase/admin";
import { INTERNAL_SECTIONS } from "@/lib/constants/departments";

export interface AssignmentUnitOption {
  id: string;
  unit_name: string;
  unit_type: "department" | "section";
}

/** Ensure every INTERNAL_SECTIONS entry exists (safe to call repeatedly). */
async function ensureInternalSectionsSeeded() {
  const supabase = createAdminClient();

  const rows = INTERNAL_SECTIONS.map((unit_name) => ({
    unit_name,
    unit_type: "section" as const,
    is_active: true,
  }));

  await supabase.from("assignment_units").upsert(rows, {
    onConflict: "unit_name",
    ignoreDuplicates: true,
  });
}

/** Load internal Collectorate sections alphabetically. */
export async function getAssignmentUnits(
  unitType: "section" | "department" = "section"
): Promise<AssignmentUnitOption[]> {
  try {
    const supabase = createAdminClient();

    if (unitType === "section") {
      await ensureInternalSectionsSeeded();
    }

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
