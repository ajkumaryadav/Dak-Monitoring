import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

// Load environment variables from .env.production, .env.local, or .env
for (const envFile of [".env.production", ".env.local", ".env"]) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    config({ path: envPath, override: false });
  }
}

const databaseUrl = process.env.DATABASE_URL;

console.log("================================================================");
console.log(" DAK MONITORING SYSTEM — DATABASE VERIFICATION & HEALTH CHECK");
console.log("================================================================");

if (!databaseUrl) {
  console.error("\n[ERROR] Missing DATABASE_URL environment variable.");
  console.error("Please add DATABASE_URL=postgresql://user:password@localhost:5432/dbname to .env.local or .env.production\n");
  process.exit(1);
}

const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ":****@");
console.log(`\nConnecting to: ${maskedUrl}`);

const REQUIRED_TABLES = [
  "activity_logs",
  "assignment_units",
  "attachments",
  "compliance_drafts",
  "dak_atr",
  "dak_entries",
  "dak_history",
  "dak_remarks",
  "dak_requests",
  "dak_sources",
  "dak_timeline",
  "dak_transfers",
  "departments",
  "master_data_audit_logs",
  "notifications",
  "orphan_cleanup_reports",
  "roles",
  "sla_rules",
  "system_admin_logs",
  "system_backups",
  "task_assignees",
  "task_compliance",
  "task_timeline",
  "tasks",
  "users",
];

const REQUIRED_RPCS = [
  "get_database_storage_stats",
  "run_database_maintenance",
];

const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10 });

async function runHealthCheck() {
  try {
    const [{ now, version }] = await sql`SELECT now(), version()`;
    console.log(`[PASS] PostgreSQL Connected successfully!`);
    console.log(`       Server Time:    ${now.toISOString()}`);
    console.log(`       Engine Version: ${version.split(" on ")[0]}\n`);

    console.log("--- TABLE INTEGRITY CHECK (25 Tables) ---");
    const existingTablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    const existingTableNames = new Set(existingTablesResult.map((r) => r.table_name));

    let tableErrors = 0;
    for (const table of REQUIRED_TABLES) {
      if (existingTableNames.has(table)) {
        const [{ count }] = await sql.unsafe(`SELECT count(*)::int AS count FROM public.${table}`);
        console.log(`  ✓ Table '${table.padEnd(26)}' : EXISTS (${count} records)`);
      } else {
        console.log(`  ✗ Table '${table.padEnd(26)}' : MISSING!`);
        tableErrors++;
      }
    }

    console.log("\n--- RPC / FUNCTION INTEGRITY CHECK ---");
    let rpcErrors = 0;
    const existingFunctionsResult = await sql`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
    `;
    const existingFunctionNames = new Set(existingFunctionsResult.map((r) => r.routine_name));

    for (const rpc of REQUIRED_RPCS) {
      if (existingFunctionNames.has(rpc)) {
        console.log(`  ✓ RPC '${rpc.padEnd(28)}' : INSTALLED`);
      } else {
        console.log(`  ✗ RPC '${rpc.padEnd(28)}' : MISSING!`);
        rpcErrors++;
      }
    }

    console.log("\n--- ESSENTIAL SEED DATA CHECK ---");
    if (existingTableNames.has("roles")) {
      const roles = await sql`SELECT slug, name FROM public.roles ORDER BY slug`;
      console.log(`  Roles found (${roles.length}): ${roles.map((r) => r.slug).join(", ")}`);
    }
    if (existingTableNames.has("departments")) {
      const [{ count: deptCount }] = await sql`SELECT count(*)::int AS count FROM public.departments WHERE is_active = true`;
      console.log(`  Active Departments: ${deptCount}`);
    }
    if (existingTableNames.has("assignment_units")) {
      const [{ count: secCount }] = await sql`SELECT count(*)::int AS count FROM public.assignment_units WHERE is_active = true`;
      console.log(`  Active Internal Sections: ${secCount}`);
    }
    if (existingTableNames.has("dak_sources")) {
      const [{ count: srcCount }] = await sql`SELECT count(*)::int AS count FROM public.dak_sources WHERE is_active = true`;
      console.log(`  Active DAK Sources: ${srcCount}`);
    }

    console.log("\n================================================================");
    if (tableErrors === 0 && rpcErrors === 0) {
      console.log(" RESULT: [PASS] Database schema is 100% complete and healthy!");
      console.log("================================================================");
      process.exit(0);
    } else {
      console.log(` RESULT: [FAIL] Found ${tableErrors} missing tables and ${rpcErrors} missing functions.`);
      console.log(" Please run 1-Setup-or-Migrate-Database.bat to initialize/repair.");
      console.log("================================================================");
      process.exit(1);
    }
  } catch (err) {
    console.error("\n[ERROR] Database connection or verification failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runHealthCheck();
