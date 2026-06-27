import { getAssignmentOfficers } from "@/features/dak/services/get-assignment-officers";
import { getAssignmentUnits } from "@/features/dak/services/get-assignment-units";
import { getDepartments } from "@/features/dak/services/get-departments";

export interface AssignFormOptions {
  departments: Awaited<ReturnType<typeof getDepartments>>;
  sections: Awaited<ReturnType<typeof getAssignmentUnits>>;
  officers: Awaited<ReturnType<typeof getAssignmentOfficers>>;
}

/** Department, section, and officer lists for the two-step assignment form. */
export async function getAssignFormOptions(): Promise<AssignFormOptions> {
  const [departments, sections, officers] = await Promise.all([
    getDepartments(),
    getAssignmentUnits("section"),
    getAssignmentOfficers(),
  ]);

  return { departments, sections, officers };
}
