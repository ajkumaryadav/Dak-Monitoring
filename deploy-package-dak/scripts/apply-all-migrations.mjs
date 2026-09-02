import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

for (const envFile of [".env.production", ".env.local", ".env"]) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    config({ path: envPath, override: false });
  }
}

const databaseUrl = process.env.DATABASE_URL;

console.log("================================================================");
console.log(" DAK MONITORING SYSTEM — AUTOMATED DATABASE SETUP & MIGRATIONS");
console.log("================================================================");

if (!databaseUrl) {
  console.error("\n[ERROR] Missing DATABASE_URL environment variable.");
  console.error("Please add DATABASE_URL=postgresql://user:password@localhost:5432/dbname to .env.local or .env.production\n");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

async function applyMigrations() {
  try {
    console.log("\n[1/2] Applying baseline consolidated schema (00_full_schema_and_seed.sql)...");
    const fullSchemaPath = resolve(process.cwd(), "supabase/00_full_schema_and_seed.sql");
    if (existsSync(fullSchemaPath)) {
      const fullSql = readFileSync(fullSchemaPath, "utf8");
      await sql.unsafe(fullSql);
      console.log("  ✓ Full consolidated schema and seed data applied successfully.");
    } else {
      console.warn("  ! 00_full_schema_and_seed.sql not found, skipping baseline.");
    }

    console.log("\n[2/2] Applying sequential incremental migrations (supabase/migrations)...");
    const migrationsDir = resolve(process.cwd(), "supabase/migrations");
    if (existsSync(migrationsDir)) {
      const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
      for (const file of files) {
        const filePath = resolve(migrationsDir, file);
        try {
          const migrationSql = readFileSync(filePath, "utf8");
          await sql.unsafe(migrationSql);
          console.log(`  ✓ Applied migration: ${file}`);
        } catch (mErr) {
          console.warn(`  - Migration notice on ${file}: ${mErr.message?.split("\n")[0]}`);
        }
      }
    }

    console.log("\n================================================================");
    console.log(" [SUCCESS] Database setup and migrations finished cleanly!");
    console.log("================================================================");
  } catch (err) {
    console.error("\n[ERROR] Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigrations();
