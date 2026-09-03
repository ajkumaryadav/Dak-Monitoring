import { cookies } from "next/headers";
import { createDirectPgClient, type DirectPgClient } from "./direct-pg-adapter";

export type DbClient = DirectPgClient;

/**
 * Server-side database client directly connected to PostgreSQL.
 * Provides .from(), .rpc(), .auth, and .storage operations.
 */
export async function createClient(): Promise<DbClient> {
  const cookieStore = await cookies();
  return createDirectPgClient(cookieStore);
}
