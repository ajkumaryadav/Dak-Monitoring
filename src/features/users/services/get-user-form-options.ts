import { getDepartmentOfficers } from "@/features/dak/services/get-department-officers";
import { getAssignmentUnits } from "@/features/dak/services/get-assignment-units";
import { getRoles } from "@/features/users/services/get-users";

export interface UserFormOptions {
  roles: Awaited<ReturnType<typeof getRoles>>;
  departments: Awaited<ReturnType<typeof getDepartmentOfficers>>;
  sections: Awaited<ReturnType<typeof getAssignmentUnits>>;
}

/** Options for user create/edit forms — department labels include officer name. */
export async function getUserFormOptions(): Promise<UserFormOptions> {
  const [roles, departments, sections] = await Promise.all([
    getRoles(),
    getDepartmentOfficers(),
    getAssignmentUnits("section"),
  ]);

  return { roles, departments, sections };
}
