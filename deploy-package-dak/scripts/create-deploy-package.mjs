import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const targetDir = resolve(rootDir, "deploy-package-dak");

console.log("================================================================");
console.log(" DAK MONITORING SYSTEM — PACKAGING OFFLINE DEPLOYMENT BUNDLE");
console.log(` Target Directory: ${targetDir}`);
console.log("================================================================");

// Step 1: Ensure fresh production build exists
console.log("\n[1/4] Verifying production build in .next ...");
if (!existsSync(join(rootDir, ".next"))) {
  console.log("  Running 'npm run build'...");
  execSync("npm run build", { stdio: "inherit", cwd: rootDir });
} else {
  console.log("  ✓ Production build found in .next");
}

// Step 2: Clean target directory
console.log("\n[2/4] Preparing clean target folder ...");
if (existsSync(targetDir)) {
  console.log("  Cleaning existing deploy-package-dak...");
  rmSync(targetDir, { recursive: true, force: true });
}
mkdirSync(targetDir, { recursive: true });

// Step 3: Copy required files and folders
console.log("\n[3/4] Copying deployment assets and pre-built dependencies ...");

const ITEMS_TO_COPY = [
  { src: ".next", dest: ".next" },
  { src: "public", dest: "public" },
  { src: "node_modules", dest: "node_modules" },
  { src: "scripts", dest: "scripts" },
  { src: "supabase", dest: "supabase" },
  { src: "tools", dest: "tools" },
  { src: "package.json", dest: "package.json" },
  { src: "next.config.ts", dest: "next.config.ts" },
  { src: ".env.production", dest: ".env.production" },
  { src: ".env.production", dest: ".env.local" },
  { src: "1-Setup-or-Migrate-Database.bat", dest: "1-Setup-or-Migrate-Database.bat" },
  { src: "2-Verify-Database.bat", dest: "2-Verify-Database.bat" },
  { src: "3-Install-Service.bat", dest: "3-Install-Service.bat" },
  { src: "Start-App-Console.bat", dest: "Start-App-Console.bat" },
  { src: "Restart-Service.bat", dest: "Restart-Service.bat" },
  { src: "Stop-Service.bat", dest: "Stop-Service.bat" },
  { src: "Status-Service.bat", dest: "Status-Service.bat" },
  { src: "Uninstall-Service.bat", dest: "Uninstall-Service.bat" },
  { src: "Run-SLA-Monitor.bat", dest: "Run-SLA-Monitor.bat" },
];

for (const item of ITEMS_TO_COPY) {
  const sourcePath = join(rootDir, item.src);
  const destPath = join(targetDir, item.dest);
  if (existsSync(sourcePath)) {
    process.stdout.write(`  Copying ${item.src} ... `);
    cpSync(sourcePath, destPath, { recursive: true });
    console.log("✓");
  } else {
    console.warn(`  ! Warning: Source item not found: ${item.src}`);
  }
}

// Ensure logs directory exists in package
mkdirSync(join(targetDir, "logs"), { recursive: true });

// Step 4: Generate DEPLOYMENT_GUIDE.md
console.log("\n[4/4] Generating offline deployment guide ...");
const deploymentGuide = `# DISTRICT DAK MONITORING SYSTEM (DDMS)
## Offline Deployment & Operations Guide for Host 10.70.233.176

This package contains the fully pre-built and self-contained District DAK Monitoring System.
No internet connection or \`npm install\` is required on the target server.

---

## 📋 Target Server Prerequisites
1. **Operating System**: Windows Server / Windows 10 / Windows 11
2. **Node.js**: Installed (Node.js 18.x, 20.x, or 22.x)
3. **PostgreSQL**: Installed and running (Default port: 5432)
4. **LAN IP**: \`10.70.233.176\` (or accessible via host IP)

---

## 🚀 Step-by-Step Zero-Failure Deployment

### STEP 1: Copy Folder to Target VM
Copy the entire \`deploy-package-dak\` folder to your desired drive on the server VM, for example:
\`\`\`text
D:\\Dak-Monitoring
\`\`\`
*(or C:\\Dak-Monitoring)*

---

### STEP 2: Configure Environment (.env.local)
Open \`.env.local\` in Notepad and ensure your PostgreSQL credentials and server URL are set:
\`\`\`env
PORT=3050
HOSTNAME=0.0.0.0
NEXTAUTH_URL=http://10.70.233.176:3050

# PostgreSQL Connection String:
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/postgres

# Storage Settings (Uses local disk for attachments in offline mode):
STORAGE_PROVIDER=local
STORAGE_LOCAL_ROOT=D:\\DakServer\\Storage
BACKUP_ROOT=D:\\DakServer\\Backups
\`\`\`

---

### STEP 3: Verify & Setup Database
1. Right-click **\`1-Setup-or-Migrate-Database.bat\`** and select **Run as administrator**.
   - This automatically runs the complete consolidated schema (\`00_full_schema_and_seed.sql\`) and applies all 39 migrations.
2. Run **\`2-Verify-Database.bat\`** to execute the database integrity test.
   - You should see \`[PASS] Database schema is 100% complete and healthy!\` for all 25 tables.

---

### STEP 4: Install & Start Windows Service
Right-click **\`3-Install-Service.bat\`** and select **Run as administrator**.
- This registers \`DakMonitoring\` as an auto-recovering Windows Service using bundled NSSM.
- Starts the application immediately on **Port 3050** bound to **0.0.0.0**.

---

### STEP 5: Access the Application
Open your browser on the host machine or LAN client:
\`\`\`text
http://10.70.233.176:3050
\`\`\`

---

## 🛠️ Operational Commands (Batch Scripts)

| Script | Purpose |
| :--- | :--- |
| **\`Start-App-Console.bat\`** | Run the app interactively in a command prompt window (useful for instant debugging). |
| **\`Status-Service.bat\`** | Check if the Windows Service is running and test HTTP connectivity. |
| **\`Restart-Service.bat\`** | Restart the Windows Service after configuration changes. |
| **\`Stop-Service.bat\`** | Stop the Windows Service. |
| **\`Uninstall-Service.bat\`** | Completely remove the Windows Service registration. |
| **\`Run-SLA-Monitor.bat\`** | Execute SLA breach checks and escalation processing (can be scheduled in Windows Task Scheduler). |

---

## 📂 Log Locations
- Service Stdout Log: \`logs\\service-stdout.log\`
- Service Stderr Log: \`logs\\service-stderr.log\`
`;

writeFileSync(join(targetDir, "DEPLOYMENT_GUIDE.md"), deploymentGuide, "utf8");
console.log("  ✓ DEPLOYMENT_GUIDE.md created.");

console.log("\n================================================================");
console.log(" [SUCCESS] Offline deployment package ready at:");
console.log(` ${targetDir}`);
console.log(" You can now copy this folder directly to 10.70.233.176!");
console.log("================================================================\n");
