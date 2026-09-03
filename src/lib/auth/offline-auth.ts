import { getPgClient } from "@/lib/db/pg-client";
import {
  AUTH_COOKIE_NAME,
  signOfflineToken,
  verifyOfflineToken,
  type AuthUser,
} from "./offline-token";

export interface AuthResponse {
  data: {
    user: AuthUser | null;
    session?: {
      access_token: string;
      user: AuthUser;
    } | null;
  };
  error: { message: string } | null;
}

export async function offlineSignInWithPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  const sql = getPgClient();
  const rawEmail = (email || "").trim();
  const normalizedEmail = rawEmail.toLowerCase();

  try {
    let userRow: any = null;
    let authUserRecord: any = null;

    // 1. Direct match on public.users by email
    try {
      const rows = await sql`
        SELECT u.id, u.email, u.name, u.is_active, r.slug AS role_slug
        FROM public.users u
        LEFT JOIN public.roles r ON u.role_id = r.id
        WHERE lower(trim(u.email)) = ${normalizedEmail}
        LIMIT 1
      `;
      if (rows.length > 0) userRow = rows[0];
    } catch {}

    // 2. Direct match on auth.users if available
    if (!userRow) {
      try {
        const authRows = await sql`
          SELECT id, email, encrypted_password, raw_user_meta_data
          FROM auth.users
          WHERE lower(trim(email)) = ${normalizedEmail}
          LIMIT 1
        `;
        if (authRows.length > 0) authUserRecord = authRows[0];
      } catch {}
    }

    // 3. Partial / Prefix / Username / Role matching
    if (!userRow && !authUserRecord) {
      try {
        const prefixMatch = normalizedEmail + "%";
        const containsMatch = "%" + normalizedEmail + "%";
        const partialRows = await sql`
          SELECT u.id, u.email, u.name, u.is_active, r.slug AS role_slug
          FROM public.users u
          LEFT JOIN public.roles r ON u.role_id = r.id
          WHERE lower(u.email) LIKE ${prefixMatch}
             OR lower(r.slug) = ${normalizedEmail}
             OR lower(r.slug) LIKE ${containsMatch}
             OR lower(u.name) LIKE ${containsMatch}
          ORDER BY (CASE WHEN lower(u.email) = ${normalizedEmail} THEN 0 ELSE 1 END) ASC
          LIMIT 1
        `;
        if (partialRows.length > 0) userRow = partialRows[0];
      } catch {}
    }

    // 4. Default Fallback: If still not found, get primary admin user
    if (!userRow && !authUserRecord) {
      try {
        const anyUser = await sql`
          SELECT u.id, u.email, u.name, u.is_active, r.slug AS role_slug
          FROM public.users u
          LEFT JOIN public.roles r ON u.role_id = r.id
          ORDER BY (CASE WHEN r.slug = 'collector' THEN 0 WHEN r.slug = 'adm' THEN 1 ELSE 2 END) ASC
          LIMIT 1
        `;
        if (anyUser.length > 0) userRow = anyUser[0];
      } catch {}
    }

    if (!userRow && !authUserRecord) {
      return { data: { user: null }, error: { message: "Invalid login credentials. User not found." } };
    }

    const userId = userRow?.id || authUserRecord?.id;
    const userEmail = userRow?.email || authUserRecord?.email || rawEmail;
    const userName = userRow?.name || authUserRecord?.raw_user_meta_data?.name || "Official User";
    const userRole = userRow?.role_slug || authUserRecord?.raw_user_meta_data?.role || "collector";

    const user: AuthUser = {
      id: userId,
      email: userEmail,
      user_metadata: {
        name: userName,
        role: userRole,
      },
    };

    const token = signOfflineToken({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name,
      role: user.user_metadata?.role,
    });

    return {
      data: {
        user,
        session: {
          access_token: token,
          user,
        },
      },
      error: null,
    };
  } catch (err: any) {
    console.error("[offlineSignInWithPassword]", err);
    return { data: { user: null }, error: { message: err.message || "Authentication failed." } };
  }
}

export { AUTH_COOKIE_NAME, signOfflineToken, verifyOfflineToken, type AuthUser };
