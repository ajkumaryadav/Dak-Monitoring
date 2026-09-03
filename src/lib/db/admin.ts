import { createDirectPgClient, type DirectPgClient } from "./direct-pg-adapter";

export type AdminDbClient = DirectPgClient;

/**
 * Server-only PostgreSQL admin client with full administrative privileges.
 */
export function createAdminClient(): AdminDbClient {
  return createDirectPgClient();
}
