import type { SessionUser } from "@/types";

/**
 * Placeholder session helper until Supabase Auth is integrated.
 * Returns a mock user for the admin shell UI.
 */
export async function getSessionUser(): Promise<SessionUser> {
  return {
    name: "District Administrator",
    email: "admin@collectorate.gov.in",
    role: "collector",
    designation: "Collector",
  };
}
