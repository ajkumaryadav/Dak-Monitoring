import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, statSync, createWriteStream, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const rootDir = process.cwd();
const outputDir = resolve(rootDir, "releases");
const stagingDir = resolve(rootDir, ".release-staging");

console.log("================================================================");
console.log(" DAK MONITORING SYSTEM - VM 10.70.233.176 RELEASE BUILDER");
console.log("================================================================");

// 1. Clean previous staging
if (existsSync(stagingDir)) {
  console.log("[1/6] Cleaning staging directory...");
  rmSync(stagingDir, { recursive: true, force: true });
}
mkdirSync(stagingDir, { recursive: true });
mkdirSync(outputDir, { recursive: true });

// 2. Execute Next.js standalone build
console.log("\n[2/6] Building Next.js standalone production bundle...");
try {
  const nextBin = resolve(rootDir, "node_modules", "next", "dist", "bin", "next");
  execSync(`"${process.execPath}" "${nextBin}" build`, {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });
} catch (err) {
  console.error("[Build Error] Next.js build failed:", err.message);
  process.exit(1);
}

// 3. Locate standalone build
console.log("\n[3/6] Verifying and copying standalone output...");
const standaloneDir = resolve(rootDir, ".next", "standalone");
if (!existsSync(standaloneDir)) {
  console.error("[Fatal] .next/standalone folder not found!");
  process.exit(1);
}

// Find server.js inside .next/standalone
function findServerJsDir(dir) {
  const items = readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name === "server.js" && item.isFile()) {
      return dir;
    }
    if (item.isDirectory() && item.name !== "node_modules") {
      const found = findServerJsDir(join(dir, item.name));
      if (found) return found;
    }
  }
  return null;
}

const serverRootDir = findServerJsDir(standaloneDir) || standaloneDir;
console.log(`  Source standalone directory: ${serverRootDir}`);
cpSync(serverRootDir, stagingDir, { recursive: true });

// Strip unnecessary bloat folders from staging
const bloatDirs = ["releases", "db backup", "security audit", ".git"];
for (const b of bloatDirs) {
  const p = join(stagingDir, b);
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
  }
}

// 4. Copy static assets, public files, scripts, migrations, tools, envs
console.log("\n[4/6] Assembling runtime assets...");

// .next/static
const targetStatic = join(stagingDir, ".next", "static");
mkdirSync(targetStatic, { recursive: true });
cpSync(resolve(rootDir, ".next", "static"), targetStatic, { recursive: true });
console.log("  ✓ .next/static copied");

// public
if (existsSync(resolve(rootDir, "public"))) {
  const targetPublic = join(stagingDir, "public");
  mkdirSync(targetPublic, { recursive: true });
  cpSync(resolve(rootDir, "public"), targetPublic, { recursive: true });
  console.log("  ✓ public assets copied");
}

// supabase (migrations)
if (existsSync(resolve(rootDir, "supabase"))) {
  const targetSupabase = join(stagingDir, "supabase");
  mkdirSync(targetSupabase, { recursive: true });
  cpSync(resolve(rootDir, "supabase"), targetSupabase, { recursive: true });
  console.log("  ✓ supabase migrations copied");
}

// scripts
if (existsSync(resolve(rootDir, "scripts"))) {
  const targetScripts = join(stagingDir, "scripts");
  mkdirSync(targetScripts, { recursive: true });
  cpSync(resolve(rootDir, "scripts"), targetScripts, { recursive: true });
  console.log("  ✓ maintenance scripts copied");
}

// tools (nssm.exe)
if (existsSync(resolve(rootDir, "tools"))) {
  const targetTools = join(stagingDir, "tools");
  mkdirSync(targetTools, { recursive: true });
  cpSync(resolve(rootDir, "tools"), targetTools, { recursive: true });
  console.log("  ✓ tools (nssm.exe) copied");
}

// Environment files
if (existsSync(resolve(rootDir, ".env.production"))) {
  cpSync(resolve(rootDir, ".env.production"), join(stagingDir, ".env.production"));
  cpSync(resolve(rootDir, ".env.production"), join(stagingDir, ".env.example"));
  console.log("  ✓ .env.production template copied");
}

// Standalone batch scripts and deployment scripts
const operationalFiles = [
  "server-https.mjs",
  "deploy-dak.ps1",
  "OFFLINE-DEPLOYMENT.md",
  "Install-Service.bat",
  "Start-Service.bat",
  "Stop-Service.bat",
  "Restart-Service.bat",
  "Status-Service.bat",
  "Uninstall-Service.bat",
  "Start-App-Console.bat",
  "Run-Diagnostics.bat",
  "Run-Migrations.bat",
  "Run-QuickFix.bat",
  "quick-fix-database.mjs",
];

for (const file of operationalFiles) {
  const srcFile = resolve(rootDir, file);
  if (existsSync(srcFile)) {
    cpSync(srcFile, join(stagingDir, file));
  }
}
mkdirSync(join(stagingDir, "logs"), { recursive: true });

// 5. Create compressed ZIP archive
console.log("\n[5/6] Creating compressed release archive...");
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const zipFileName = `DAK-Release-${timestamp}.zip`;
const zipFilePath = join(outputDir, zipFileName);

if (existsSync(zipFilePath)) {
  rmSync(zipFilePath, { force: true });
}

try {
  execSync(`tar.exe -a -c -f "${zipFilePath}" *`, {
    cwd: stagingDir,
    stdio: "inherit",
  });
} catch {
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipFilePath}' -Force"`, {
    stdio: "inherit",
  });
}

// 6. Compute Checksum & Summary
console.log("\n[6/6] Finalizing release package...");
const zipStats = statSync(zipFilePath);
const zipSizeMB = (zipStats.size / (1024 * 1024)).toFixed(2);
const zipBuffer = readFileSync(zipFilePath);
const sha256 = createHash("sha256").update(zipBuffer).digest("hex");

// Copy deploy-dak.ps1 and quick start guide next to the zip in releases folder
cpSync(resolve(rootDir, "deploy-dak.ps1"), join(outputDir, "deploy-dak.ps1"));
if (existsSync(resolve(rootDir, "OFFLINE-DEPLOYMENT.md"))) {
  cpSync(resolve(rootDir, "OFFLINE-DEPLOYMENT.md"), join(outputDir, "OFFLINE-DEPLOYMENT.md"));
}

// Clean staging directory
rmSync(stagingDir, { recursive: true, force: true });

console.log("\n================================================================");
console.log(" [SUCCESS] DAK UPDATE PACKAGE GENERATED SUCCESSFULLY!");
console.log("================================================================");
console.log(` Package:   ${zipFileName}`);
console.log(` Location:  ${zipFilePath}`);
console.log(` Size:      ${zipSizeMB} MB`);
console.log(` SHA-256:   ${sha256}`);
console.log(` Deployer:  ${join(outputDir, "deploy-dak.ps1")}`);
console.log("================================================================");
console.log("\nDEPLOYMENT INSTRUCTIONS FOR VM 10.70.233.176:");
console.log(`1. Copy '${zipFileName}' and 'deploy-dak.ps1' to VM 10.70.233.176.`);
console.log(`2. Open PowerShell as Administrator on the VM and execute:`);
console.log(`   .\\deploy-dak.ps1 -Release .\\${zipFileName}`);
console.log("================================================================\n");
