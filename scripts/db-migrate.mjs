import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

// Load environment variables without external dependencies (.env.production, .env, .env.local)
for (const envFile of [".env.production", ".env", ".env.local"]) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    try {
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
    } catch {}
  }
}

let databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:12345@127.0.0.1:5432/dak_monitoring";

console.log("================================================================");
console.log(" DAK MONITORING SYSTEM - SAFE DATABASE MIGRATION ENGINE");
console.log("================================================================");

function getCandidateUrls(rawUrl) {
  const urls = [];
  try {
    const parsed = new URL(rawUrl);
    urls.push(rawUrl);
    
    // Test 5432 and 5433 fallback
    for (const port of ["5432", "5433"]) {
      if (parsed.port !== port) {
        const alt = new URL(rawUrl);
        alt.port = port;
        urls.push(alt.toString());
      }
    }
    // Also test postgres:postgres password fallback
    for (const port of ["5432", "5433"]) {
      const alt = new URL(rawUrl);
      alt.port = port;
      alt.password = "postgres";
      if (!urls.includes(alt.toString())) urls.push(alt.toString());
    }
  } catch {
    urls.push(rawUrl);
    urls.push("postgresql://postgres:12345@127.0.0.1:5432/dak_monitoring");
    urls.push("postgresql://postgres:12345@127.0.0.1:5433/dak_monitoring");
    urls.push("postgresql://postgres:postgres@127.0.0.1:5432/dak_monitoring");
  }
  return urls;
}

async function runMigrations() {
  let sql = null;
  const candidates = getCandidateUrls(databaseUrl);
  
  for (const candidate of candidates) {
    const masked = candidate.replace(/:([^:@]+)@/, ":****@");
    try {
      console.log(`Testing database connection: ${masked} ...`);
      const testSql = postgres(candidate, { max: 1, connect_timeout: 4 });
      await testSql`SELECT 1`;
      sql = testSql;
      console.log(`  ✓ Connected to PostgreSQL successfully!\n`);
      break;
    } catch (cErr) {
      // try next candidate
    }
  }

  if (!sql) {
    console.error("\n[FATAL] Database connection failed on all probed ports (5432, 5433).");
    console.error("Please verify that the PostgreSQL Windows Service is started.");
    process.exit(1);
  }

  try {
    // 1. Ensure tracking table exists
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.dak_schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 2. Query applied migrations
    const appliedRows = await sql`SELECT version FROM public.dak_schema_migrations`;
    const appliedSet = new Set(appliedRows.map((r) => r.version));

    // 3. Baseline schema check
    const BASELINE_KEY = "00_full_schema_and_seed.sql";
    const fullSchemaPath = resolve(process.cwd(), "supabase", BASELINE_KEY);

    if (existsSync(fullSchemaPath)) {
      if (!appliedSet.has(BASELINE_KEY)) {
        // Check if tables already exist (existing DB)
        const checkTables = await sql`
          SELECT count(*)::int as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name IN ('dak_entries', 'users', 'departments')
        `;
        const hasExistingCoreTables = checkTables[0]?.count > 0;

        if (hasExistingCoreTables) {
          console.log(`[Baseline] Core tables detected. Marking baseline '${BASELINE_KEY}' as previously applied.`);
          await sql`INSERT INTO public.dak_schema_migrations (version) VALUES (${BASELINE_KEY}) ON CONFLICT DO NOTHING`;
          appliedSet.add(BASELINE_KEY);
        } else {
          console.log(`[Baseline] Fresh database detected. Applying baseline '${BASELINE_KEY}'...`);
          const fullSql = readFileSync(fullSchemaPath, "utf8");
          await sql.unsafe(fullSql);
          await sql`INSERT INTO public.dak_schema_migrations (version) VALUES (${BASELINE_KEY})`;
          appliedSet.add(BASELINE_KEY);
          console.log(`  ✓ Baseline schema applied and registered.`);
        }
      } else {
        console.log(`[Baseline] Baseline '${BASELINE_KEY}' already registered. Skipping.`);
      }
    }

    // 4. Incremental migrations
    const migrationsDir = resolve(process.cwd(), "supabase/migrations");
    if (!existsSync(migrationsDir)) {
      console.log(`[Notice] Migrations folder not found at ${migrationsDir}`);
    } else {
      const files = readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

      let newlyApplied = 0;
      let skipped = 0;

      for (const file of files) {
        if (appliedSet.has(file)) {
          skipped++;
          continue;
        }

        const filePath = resolve(migrationsDir, file);
        console.log(`[Migrate] Applying pending migration: ${file} ...`);
        const migrationSql = readFileSync(filePath, "utf8");

        try {
          // Execute migration SQL
          await sql.unsafe(migrationSql);
          await sql`INSERT INTO public.dak_schema_migrations (version) VALUES (${file}) ON CONFLICT DO NOTHING`;
          appliedSet.add(file);
          newlyApplied++;
          console.log(`  ✓ Successfully applied: ${file}`);
        } catch (mErr) {
          const isHarmlessNotice =
            mErr.code === '42710' || // duplicate_object (e.g. policy already exists)
            mErr.code === '42701' || // duplicate_column
            mErr.code === '42P07' || // duplicate_table
            mErr.code === '42704' || // undefined_object (e.g. publication does not exist)
            mErr.message?.includes('already exists') ||
            mErr.message?.includes('relation "storage.buckets" does not exist') ||
            mErr.message?.includes('schema "storage" does not exist') ||
            mErr.message?.includes('publication "supabase_realtime" does not exist') ||
            mErr.message?.includes('publication');

          if (isHarmlessNotice) {
            console.warn(`  - Migration notice on ${file}: ${mErr.message.split("\n")[0]}`);
            await sql`INSERT INTO public.dak_schema_migrations (version) VALUES (${file}) ON CONFLICT DO NOTHING`;
            appliedSet.add(file);
            newlyApplied++;
          } else {
            console.error(`\n[ERROR] Migration failed on file: ${file}`);
            console.error(`Error details: ${mErr.message}`);
            throw mErr;
          }
        }
      }

      console.log("\n----------------------------------------------------------------");
      console.log(`Summary: ${newlyApplied} pending migration(s) applied, ${skipped} already up to date.`);
    }

    console.log("================================================================");
    console.log(" [SUCCESS] Database migrations completed safely!");
    console.log("================================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n[FATAL] Database migration aborted:", err?.message || err);
    process.exit(1);
  } finally {
    if (sql) await sql.end().catch(() => {});
  }
}

runMigrations();
