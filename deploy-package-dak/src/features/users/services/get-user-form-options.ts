import { getDepartments } from "@/features/dak/services/get-departments";
import { getAssignmentUnits } from "@/features/dak/services/get-assignment-units";
import { getRoles } from "@/features/users/services/get-users";

export interface UserFormOptions {
  roles: Awaited<ReturnType<typeof getRoles>>;
  departments: Awaited<ReturnType<typeof getDepartments>>;
  sections: Awaited<ReturnType<typeof getAssignmentUnits>>;
}

/** Options for user create/edit forms. */
export async function getUserFormOptions(): Promise<UserFormOptions> {
  const [roles, departments, sections] = await Promise.all([
    getRoles(),
    getDepartments(),
    getAssignmentUnits("section"),
  ]);

  return { roles, departments, sections };
}
