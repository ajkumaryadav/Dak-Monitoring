import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __pgSql: postgres.Sql | undefined;
}

function loadEnvFiles() {
  if (typeof process === "undefined" || !process.cwd) return;
  // If process.env.DATABASE_URL is already provided (e.g. by Next.js or system environment), keep it
  if (process.env.DATABASE_URL) return;

  const isProd = process.env.NODE_ENV === "production";
  // Priority: .env.local (in dev), .env.production (in prod), .env
  const files = isProd ? [".env.production", ".env"] : [".env.local", ".env.development", ".env.production", ".env"];
  for (const envFile of files) {
    try {
      const envPath = resolve(process.cwd(), envFile);
      if (existsSync(envPath)) {
        const raw = readFileSync(envPath, "utf8");
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx > 0) {
              const key = trimmed.slice(0, eqIdx).trim();
              const val = trimmed.slice(eqIdx + 1).trim().replace(/^["'](.*)["']$/, "$1");
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        }
      }
    } catch {}
  }
}

function getDatabaseUrl(): string {
  loadEnvFiles();
  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl) {
    return envUrl;
  }
  return "postgresql://postgres:12345@127.0.0.1:5432/dak_monitoring";
}

export function getPgClient(): postgres.Sql {
  if (global.__pgSql) {
    return global.__pgSql;
  }

  const databaseUrl = getDatabaseUrl();

  const client = postgres(databaseUrl, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    transform: {
      undefined: null,
    },
  });

  global.__pgSql = client;

  return client;
}

export const sql = getPgClient();
