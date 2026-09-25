import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

console.log("================================================================");
console.log(" DAK MONITORING SYSTEM — LIVE PRODUCTION DIAGNOSTIC SUITE");
console.log("================================================================\n");

// 1. Inspect Environment Files
console.log(">>> [1/5] INSPECTING ENVIRONMENT CONFIGURATION...");
const envFiles = [".env", ".env.local", ".env.production"];
const loadedEnv = {};

for (const envFile of envFiles) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    console.log(`  Found: ${envFile}`);
    try {
      const raw = readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["'](.*)["']$/, "$1");
            if (!loadedEnv[key]) {
              loadedEnv[key] = { value: val, source: envFile };
            }
          }
        }
      }
    } catch (e) {
      console.warn(`    Error reading ${envFile}:`, e.message);
    }
  } else {
    console.log(`  Missing: ${envFile}`);
  }
}

console.log("\n  Resolved Variables:");
for (const [k, v] of Object.entries(loadedEnv)) {
  const displayVal = k.toLowerCase().includes("password") || k.toLowerCase().includes("secret")
    ? "****"
    : v.value;
  console.log(`    ${k.padEnd(20)} = ${displayVal} (from ${v.source})`);
}

// 2. Scan Candidate PostgreSQL Connections
console.log("\n>>> [2/5] SCANNING POSTGRESQL INSTANCES (Port 5432, 5433, 5434)...");

const currentUrl = loadedEnv.DATABASE_URL?.value || process.env.DATABASE_URL || "";
const candidateUrls = [];

if (currentUrl) {
  candidateUrls.push({ url: currentUrl, desc: "Current configured URL in .env" });
}

const standardCandidates = [
  "postgresql://postgres:12345@127.0.0.1:5433/dak_monitoring",
  "postgresql://postgres:12345@127.0.0.1:5432/dak_monitoring",
  "postgresql://postgres:postgres@127.0.0.1:5432/dak_monitoring",
  "postgresql://postgres:postgres@127.0.0.1:5433/dak_monitoring",
  "postgresql://postgres:12345@localhost:5433/dak_monitoring",
  "postgresql://postgres:12345@localhost:5432/dak_monitoring",
  "postgresql://postgres:postgres@localhost:5432/dak_monitoring",
];

for (const c of standardCandidates) {
  if (!candidateUrls.some((u) => u.url === c)) {
    candidateUrls.push({ url: c, desc: "Standard candidate" });
  }
}

let activeClient = null;
let activeUrl = null;
let activePort = null;

for (const candidate of candidateUrls) {
  const masked = candidate.url.replace(/:([^:@]+)@/, ":****@");
  process.stdout.write(`  Testing: ${masked.padEnd(65)} `);
  let testSql = null;
  try {
    testSql = postgres(candidate.url, { max: 1, connect_timeout: 4 });
    const [{ version }] = await testSql`SELECT version()`;
    console.log(`[CONNECTED!]`);
    activeClient = testSql;
    activeUrl = candidate.url;
    try {
      activePort = new URL(candidate.url).port || "5432";
    } catch {}
    break;
  } catch (err) {
    console.log(`[FAILED: ${err.message}]`);
    if (testSql) await testSql.end().catch(() => {});
  }
}

if (!activeClient) {
  console.error("\n[CRITICAL ERROR] Could not connect to PostgreSQL on any local port (5432 or 5433).");
  console.error("Please verify that the PostgreSQL service (postgresql-x64-XX) is started in Windows Services (services.msc).");
  process.exit(1);
}

// 3. Inspect Database Tables and Record Counts
console.log(`\n>>> [3/5] CHECKING DATA TABLES IN DATABASE (Connected to Port ${activePort})...`);

try {
  const checkTables = [
    "dak_entries",
    "users",
    "roles",
    "departments",
    "assignment_units",
    "dak_sources",
    "tasks",
    "notifications",
    "activity_logs",
    "compliance_drafts"
  ];

  for (const table of checkTables) {
    try {
      const [{ count }] = await activeClient.unsafe(`SELECT count(*)::int AS count FROM public."${table}"`);
      console.log(`  Table '${table.padEnd(22)}' : ${count} record(s)`);
    } catch (e) {
      console.log(`  Table '${table.padEnd(22)}' : [TABLE NOT FOUND / ERROR: ${e.message}]`);
    }
  }

  // 4. Inspect User Accounts & Roles
  console.log("\n>>> [4/5] INSPECTING USER ACCOUNTS & ROLES...");
  try {
    const users = await activeClient`
      SELECT u.id, u.email, u.name, u.is_active, r.slug AS role_slug, r.name AS role_name
      FROM public.users u
      LEFT JOIN public.roles r ON u.role_id = r.id
      ORDER BY u.created_at ASC
    `;

    if (users.length === 0) {
      console.warn("  [WARNING] public.users table is currently EMPTY!");
    } else {
      console.log(`  Found ${users.length} user(s) in database:`);
      for (const u of users) {
        console.log(`    - [${u.role_slug || "NO ROLE"}] ${u.name} <${u.email}> (Active: ${u.is_active}) ID: ${u.id}`);
      }
    }
  } catch (e) {
    console.warn("  Error querying users:", e.message);
  }

  // 5. Inspect Sample DAK Entries
  console.log("\n>>> [5/5] INSPECTING RECENT DAK RECORDS...");
  try {
    const daks = await activeClient`
      SELECT id, dak_number, subject, status, priority, due_date, created_at, department_id, source_id
      FROM public.dak_entries
      ORDER BY created_at DESC
      LIMIT 5
    `;

    if (daks.length === 0) {
      console.warn("  [NOTICE] public.dak_entries currently has 0 rows in this database.");
    } else {
      console.log(`  Sample ${daks.length} most recent DAK record(s):`);
      for (const d of daks) {
        console.log(`    - DAK #${d.dak_number} [${d.status}] (${d.priority}) "${d.subject?.slice(0, 40)}" Created: ${d.created_at}`);
      }
    }
  } catch (e) {
    console.warn("  Error querying dak_entries:", e.message);
  }

  // Auto-Sync .env if URL changed
  if (activeUrl && activeUrl !== loadedEnv.DATABASE_URL?.value) {
    console.log("\n================================================================");
    console.log(" AUTO-REPAIR: Updating .env to active database connection...");
    console.log("================================================================");
    try {
      const activeEnvPath = resolve(process.cwd(), ".env");
      let envContent = "";
      if (existsSync(activeEnvPath)) {
        envContent = readFileSync(activeEnvPath, "utf8");
      }
      
      if (envContent.includes("DATABASE_URL=")) {
        envContent = envContent.replace(/DATABASE_URL=[^\r\n]*/, `DATABASE_URL=${activeUrl}`);
      } else {
        envContent += `\nDATABASE_URL=${activeUrl}\n`;
      }
      
      writeFileSync(activeEnvPath, envContent, "utf8");
      console.log(`  ✓ Updated ${activeEnvPath} with working DATABASE_URL`);
    } catch (e) {
      console.warn("  Could not auto-write .env:", e.message);
    }
  }

  console.log("\n================================================================");
  console.log(" [DIAGNOSTIC COMPLETE]");
  console.log("================================================================\n");

  await activeClient.end();
} catch (err) {
  console.error("Diagnostic execution error:", err.message);
  if (activeClient) await activeClient.end().catch(() => {});
}
