import { cookies } from "next/headers";
import { getPgClient } from "@/lib/db/pg-client";
import { PgQueryBuilder } from "@/lib/db/pg-query-builder";
import {
  AUTH_COOKIE_NAME,
  offlineSignInWithPassword,
  verifyOfflineToken,
  type AuthUser,
} from "@/lib/auth/offline-auth";
import { getStorageProvider } from "@/lib/storage/storage-service";

export interface DirectPgClient {
  from: <T = any>(tableName: string) => PgQueryBuilder<T>;
  rpc: (funcName: string, params?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{
      data: { user: AuthUser | null; session: any };
      error: { message: string } | null;
    }>;
    getUser: (jwt?: string) => Promise<{
      data: { user: AuthUser | null };
      error: { message: string } | null;
    }>;
    getSession: () => Promise<{
      data: { session: any };
      error: { message: string } | null;
    }>;
    signOut: () => Promise<{ error: null }>;
    updateUser: (attributes: any) => Promise<{ data: { user: AuthUser | null }; error: { message: string } | null }>;
    onAuthStateChange: (cb: any) => { data: { subscription: { unsubscribe: () => void } } };
    admin: {
      createUser: (attributes: any) => Promise<{ data: any; error: any }>;
      updateUserById: (uid: string, attributes: any) => Promise<{ data: any; error: any }>;
      deleteUser: (uid: string) => Promise<{ data: any; error: any }>;
      signOut: (uid?: string, scope?: string) => Promise<{ data: any; error: any }>;
      listUsers: () => Promise<{ data: { users: any[] }; error: any }>;
    };
  };
  storage: {
    from: (bucket: string) => any;
  };
}

export function createDirectPgClient(cookieStore?: any): DirectPgClient {
  const sql = getPgClient();

  return {
    from: <T = any>(tableName: string) => {
      return new PgQueryBuilder<T>(tableName);
    },

    rpc: async (funcName: string, params: Record<string, unknown> = {}) => {
      try {
        const paramKeys = Object.keys(params);
        if (paramKeys.length === 0) {
          const res = await sql.unsafe(`SELECT public.${funcName}() AS result`);
          return { data: res[0]?.result ?? res[0] ?? null, error: null };
        }

        const args = paramKeys.map((k, i) => `$${i + 1}`).join(", ");
        const values = paramKeys.map((k) => params[k]);
        const res = await sql.unsafe(`SELECT public.${funcName}(${args}) AS result`, values as any);
        return { data: res[0]?.result ?? res[0] ?? null, error: null };
      } catch (err: any) {
        console.error(`[RPC ${funcName}]`, err);
        return { data: null, error: { message: err.message || "RPC failed" } };
      }
    },

    auth: {
      signInWithPassword: async ({ email, password }) => {
        const result = await offlineSignInWithPassword(email, password);
        if (!result.error && result.data.session?.access_token) {
          try {
            const store = cookieStore || (await cookies());
            store.set(AUTH_COOKIE_NAME, result.data.session.access_token, {
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.COOKIE_SECURE === "true",
              maxAge: 7 * 24 * 3600,
            });
          } catch {
            // In case of non-action context
          }
        }
        return {
          data: {
            user: result.data.user,
            session: result.data.session,
          },
          error: result.error,
        };
      },

      getUser: async (jwtToken?: string) => {
        let token = jwtToken;
        if (!token) {
          try {
            const store = cookieStore || (await cookies());
            token = store.get(AUTH_COOKIE_NAME)?.value;
          } catch {
            token = undefined;
          }
        }

        if (!token) {
          return { data: { user: null }, error: null };
        }

        const user = verifyOfflineToken(token);
        return { data: { user }, error: null };
      },

      getSession: async () => {
        let token: string | undefined;
        try {
          const store = cookieStore || (await cookies());
          token = store.get(AUTH_COOKIE_NAME)?.value;
        } catch {
          token = undefined;
        }

        if (!token) {
          return { data: { session: null }, error: null };
        }

        const user = verifyOfflineToken(token);
        if (!user) {
          return { data: { session: null }, error: null };
        }

        return {
          data: {
            session: {
              access_token: token,
              user,
            },
          },
          error: null,
        };
      },

      signOut: async () => {
        try {
          const store = cookieStore || (await cookies());
          store.delete(AUTH_COOKIE_NAME);
        } catch {}
        return { error: null };
      },

      updateUser: async (attributes: any) => {
        try {
          let token: string | undefined;
          try {
            const store = cookieStore || (await cookies());
            token = store.get(AUTH_COOKIE_NAME)?.value;
          } catch {
            token = undefined;
          }

          const user = token ? verifyOfflineToken(token) : null;
          if (!user) return { data: { user: null }, error: { message: "Not authenticated" } };

          if (attributes.password) {
            try {
              await sql`
                UPDATE auth.users
                SET encrypted_password = crypt(${attributes.password}, gen_salt('bf'))
                WHERE id = ${user.id}
              `;
            } catch {}
          }
          return { data: { user }, error: null };
        } catch (err: any) {
          return { data: { user: null }, error: { message: err.message } };
        }
      },

      onAuthStateChange: () => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },

      admin: {
        createUser: async (attributes: any) => {
          try {
            const email = attributes.email?.trim().toLowerCase();
            const name = attributes.user_metadata?.name || attributes.name || "User";
            const roleId = attributes.user_metadata?.roleId || attributes.role_id;
            const deptId = attributes.user_metadata?.departmentId || attributes.department_id;
            const secId = attributes.user_metadata?.sectionId || attributes.section_id;

            const rows = await sql`
              INSERT INTO public.users (email, name, role_id, department_id, section_id, is_active)
              VALUES (${email}, ${name}, ${roleId}, ${deptId}, ${secId}, true)
              RETURNING *
            `;
            return { data: { user: rows[0] }, error: null };
          } catch (err: any) {
            return { data: { user: null }, error: { message: err.message } };
          }
        },

        updateUserById: async (uid: string, attributes: any) => {
          try {
            const updates: Record<string, any> = {};
            if (attributes.email) updates.email = attributes.email.trim().toLowerCase();
            if (attributes.user_metadata?.name) updates.name = attributes.user_metadata.name;

            const setClauses = Object.keys(updates).map((k) => `"${k}" = ${updates[k]}`);
            if (setClauses.length > 0) {
              const rows = await sql`
                UPDATE public.users SET ${sql(updates)} WHERE id = ${uid} RETURNING *
              `;
              return { data: { user: rows[0] }, error: null };
            }
            return { data: { user: null }, error: null };
          } catch (err: any) {
            return { data: { user: null }, error: { message: err.message } };
          }
        },

        deleteUser: async (uid: string) => {
          try {
            await sql`DELETE FROM public.users WHERE id = ${uid}`;
            return { data: { user: null }, error: null };
          } catch (err: any) {
            return { data: { user: null }, error: { message: err.message } };
          }
        },

        signOut: async () => {
          return { data: null, error: null };
        },

        listUsers: async () => {
          try {
            const rows = await sql`SELECT * FROM public.users`;
            return { data: { users: rows }, error: null };
          } catch (err: any) {
            return { data: { users: [] }, error: { message: err.message } };
          }
        },
      },
    },

    storage: {
      from: (bucket: string) => {
        const provider = getStorageProvider();
        return {
          upload: async (path: string, file: File | Blob | Buffer, options?: any) => {
            try {
              let buffer: Buffer;
              let mimeType = options?.contentType || "application/octet-stream";
              if (file instanceof Buffer) {
                buffer = file;
              } else if (typeof (file as any).arrayBuffer === "function") {
                const ab = await (file as any).arrayBuffer();
                buffer = Buffer.from(ab);
                mimeType = (file as any).type || mimeType;
              } else {
                buffer = Buffer.from(file as any);
              }

              const res = await provider.upload({
                bucket,
                path,
                data: buffer,
                contentType: mimeType,
                upsert: options?.upsert ?? true,
              });
              return { data: res, error: null };
            } catch (err: any) {
              return { data: null, error: { message: err.message } };
            }
          },

          download: async (path: string) => {
            try {
              const res = await provider.download(bucket, path);
              return { data: new Blob([new Uint8Array(res.data)]), error: null };
            } catch (err: any) {
              return { data: null, error: { message: err.message } };
            }
          },

          remove: async (paths: string[]) => {
            try {
              await provider.remove(bucket, paths);
              return { data: null, error: null };
            } catch (err: any) {
              return { data: null, error: { message: err.message } };
            }
          },

          createSignedUrl: async (path: string, expiresIn = 3600) => {
            try {
              const res = await provider.getSignedUrl(bucket, path, expiresIn);
              return { data: { signedUrl: res || "" }, error: null };
            } catch (err: any) {
              return { data: null, error: { message: err.message } };
            }
          },

          getPublicUrl: (path: string) => {
            return { data: { publicUrl: `/api/storage/${bucket}/${path}` } };
          },
        };
      },
    },
  };
}
