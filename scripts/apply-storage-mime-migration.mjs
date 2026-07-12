/**
 * Apply migration 000034_storage_office_mime_types.sql using a direct Postgres connection.
 *
 * Run: npm run db:apply-storage-mime-types
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
      "Paste supabase/migrations/000034_storage_office_mime_types.sql into Supabase SQL Editor and run it manually."
  );
  process.exit(1);
}

const sqlPath = resolve(
  process.cwd(),
  "supabase/migrations/000034_storage_office_mime_types.sql"
);
const migrationSql = readFileSync(sqlPath, "utf8");

const db = postgres(databaseUrl, { max: 1 });

try {
  console.log("Applying 000034_storage_office_mime_types.sql...");
  await db.unsafe(migrationSql);
  console.log("Done. Excel and other office formats can now be uploaded.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await db.end();
}
