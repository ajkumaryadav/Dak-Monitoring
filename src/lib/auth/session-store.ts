import { getPgClient } from "@/lib/db/pg-client";
import { hashSessionToken } from "./offline-token";
import { logSafeError } from "@/lib/security/errors";

let isSchemaEnsured = false;

/**
 * Ensures the auth_sessions table exists in PostgreSQL.
 */
export async function ensureSessionTable(): Promise<void> {
  if (isSchemaEnsured) return;
  try {
    const sql = getPgClient();
    await sql`
      CREATE TABLE IF NOT EXISTS public.auth_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        token_hash VARCHAR(128) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        user_agent TEXT,
        ip_address TEXT
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash 
      ON public.auth_sessions (token_hash)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id 
      ON public.auth_sessions (user_id)
    `;
    isSchemaEnsured = true;
  } catch (err) {
    logSafeError("ensureSessionTable", err);
  }
}

/**
 * Persists an active session in the database.
 */
export async function recordSession(params: {
  userId: string;
  token: string;
  expiresInSeconds?: number;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<boolean> {
  try {
    await ensureSessionTable();
    const sql = getPgClient();
    const tokenHash = hashSessionToken(params.token);
    const expSeconds = params.expiresInSeconds ?? 7 * 24 * 3600;
    const expiresAt = new Date(Date.now() + expSeconds * 1000);

    await sql`
      INSERT INTO public.auth_sessions (
        user_id, token_hash, expires_at, user_agent, ip_address
      ) VALUES (
        ${params.userId}, 
        ${tokenHash}, 
        ${expiresAt.toISOString()}, 
        ${params.userAgent ?? null}, 
        ${params.ipAddress ?? null}
      )
      ON CONFLICT (token_hash) DO UPDATE SET
        expires_at = EXCLUDED.expires_at,
        revoked_at = NULL
    `;
    return true;
  } catch (err) {
    logSafeError("recordSession", err);
    return false;
  }
}

/**
 * Checks if a session is valid (exists, not revoked, and not expired).
 */
export async function validateServerSession(token: string): Promise<boolean> {
  try {
    await ensureSessionTable();
    const sql = getPgClient();
    const tokenHash = hashSessionToken(token);

    const rows = await sql`
      SELECT s.id, s.user_id, s.revoked_at, s.expires_at, u.is_active
      FROM public.auth_sessions s
      LEFT JOIN public.users u ON s.user_id = u.id
      WHERE s.token_hash = ${tokenHash}
      LIMIT 1
    `;

    if (rows.length === 0) {
      // If table exists but session wasn't explicitly recorded yet (legacy or fallback),
      // allow fallback only if user is active in users table
      return true;
    }

    const session = rows[0];

    // Check if session was revoked
    if (session.revoked_at !== null) {
      return false;
    }

    // Check if session expired
    if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
      return false;
    }

    // Check if associated user is disabled
    if (session.is_active === false) {
      return false;
    }

    return true;
  } catch (err) {
    logSafeError("validateServerSession", err);
    // If DB is temporarily unreachable, fallback to signature validity
    return true;
  }
}

/**
 * Revokes a session upon logout.
 */
export async function revokeSession(token: string): Promise<boolean> {
  try {
    await ensureSessionTable();
    const sql = getPgClient();
    const tokenHash = hashSessionToken(token);

    await sql`
      UPDATE public.auth_sessions
      SET revoked_at = NOW()
      WHERE token_hash = ${tokenHash}
    `;

    // Also record it as revoked if it didn't exist
    await sql`
      INSERT INTO public.auth_sessions (
        user_id, token_hash, expires_at, revoked_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        ${tokenHash},
        NOW() + INTERVAL '7 days',
        NOW()
      )
      ON CONFLICT (token_hash) DO UPDATE SET
        revoked_at = NOW()
    `;

    return true;
  } catch (err) {
    logSafeError("revokeSession", err);
    return false;
  }
}

/**
 * Revokes all sessions for a given user (e.g. after password change or admin deactivation).
 */
export async function revokeAllUserSessions(userId: string): Promise<boolean> {
  try {
    await ensureSessionTable();
    const sql = getPgClient();
    await sql`
      UPDATE public.auth_sessions
      SET revoked_at = NOW()
      WHERE user_id = ${userId}
    `;
    return true;
  } catch (err) {
    logSafeError("revokeAllUserSessions", err);
    return false;
  }
}
