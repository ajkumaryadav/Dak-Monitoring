/**
 * Apply migration 000033_compliance_drafts.sql using a direct Postgres connection.
 *
 * Add to .env.local (Supabase → Project Settings → Database → Connection string → URI):
 *   DATABASE_URL=postgresql://postgres.[ref]:[password]@...
 *
 * Then run: npm run db:apply-compliance-drafts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env.local") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL in .env.local.\n\n" +
      "Either:\n" +
      "  1. Add DATABASE_URL from Supabase → Settings → Database → Connection string (URI), then re-run this script.\n" +
      "  2. Paste supabase/migrations/000033_compliance_drafts.sql into Supabase SQL Editor and run it manually."
  );
  process.exit(1);
}

const sqlPath = resolve(
  process.cwd(),
  "supabase/migrations/000033_compliance_drafts.sql"
);
const migrationSql = readFileSync(sqlPath, "utf8");

const db = postgres(databaseUrl, { max: 1 });

try {
  console.log("Applying 000033_compliance_drafts.sql...");
  await db.unsafe(migrationSql);
  console.log("Done. dak_atr.is_draft is ready — refresh your app.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await db.end();
}
