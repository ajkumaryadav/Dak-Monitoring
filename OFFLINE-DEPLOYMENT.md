# DAK Monitoring System — Offline Production Deployment & Operations Guide

This guide covers the end-to-end workflow for building, packaging, deploying, and maintaining the **District DAK & Administrative Monitoring System** in an offline, air-gapped Windows Server LAN environment.

---

## 🏛️ System Overview

- **Runtime**: Next.js 16 (Standalone Server) + Node.js LTS
- **Database**: PostgreSQL (connected via native `postgres` pool)
- **Service Manager**: NSSM (Non-Sucking Service Manager)
- **Target Port**: `8080` (bound to `0.0.0.0`)
- **Internet Dependency**: **ZERO** (all JS, CSS, Google fonts, icons, and libraries are self-contained)

---

## 📦 Directory Structure on Target VM

```text
D:\DAK\
├── current\                         <-- Active running release (symlink or atomic folder)
│   ├── server.js                    <-- Standalone Next.js entrypoint
│   ├── .next\                       <-- Pre-built server & static assets
│   ├── node_modules\                <-- Minimal production runtime dependencies
│   ├── public\                      <-- Static assets
│   ├── scripts\                     <-- Database migration & verification scripts
│   ├── supabase\                    <-- SQL migration files
│   ├── tools\                       <-- nssm.exe
│   ├── logs\                        <-- stdout / stderr logs
│   ├── .env                         <-- Active environment configuration
│   └── *.bat                        <-- Operational batch scripts
├── releases\                        <-- Timestamped deployed releases
│   ├── DAK-Release-20260903-120000\
│   └── DAK-Release-20260903-130000\
├── backup\                          <-- Pre-deployment backups for instant rollback
│   └── DAK-Backup-20260903-120000\
└── deploy\                          <-- Deployment staging area
```

---

## 🚀 Workflow 1: Build Release Package (Development PC)

On your development PC (which may have internet access to install/build):

1. Open PowerShell in the project root: `d:\aj\Dak`
2. Run the build script:
   ```powershell
   .\build-dak-release.ps1
   ```
3. The script will:
   - Clean previous build caches
   - Run `npm run build` with Next.js Standalone mode
   - Assemble `.next/standalone`, `.next/static`, `public`, migration scripts, and NSSM
   - Create a versioned ZIP package under `releases\`:
     `releases\DAK-Release-YYYY-MM-DD-HHMM.zip`

---

## 🚀 Workflow 2: Deploy to Offline VM (One-Command Deployment)

1. **Transfer** the `DAK-Release-*.zip` file to the offline Windows Server VM (e.g. via USB drive or secure LAN share to `D:\DAK\deploy`).
2. Open **PowerShell as Administrator** on the VM.
3. Navigate to the folder containing the ZIP file and run:
   ```powershell
   .\deploy-dak.ps1 -Release .\DAK-Release-2026-09-03-1200.zip -TargetRoot D:\DAK -Port 8080
   ```
4. **What the deployment script does automatically**:
   - Verifies Node.js installation.
   - Extracts release to `D:\DAK\releases\DAK-Release-<timestamp>`.
   - Preserves existing production `.env` (or creates one from template if first time).
   - Runs database schema migrations (`scripts/db-migrate.mjs`) safely without data loss.
   - Stops the existing `DAKMonitoring` service and creates a pre-deployment backup in `D:\DAK\backup\`.
   - Atomically updates `D:\DAK\current\`.
   - Reconfigures and starts the `DAKMonitoring` Windows Service via NSSM.
   - Executes automated HTTP health check against `http://127.0.0.1:8080/api/health`.
   - If health check fails, **automatically rolls back** to the previous working backup.

---

## ⚙️ Environment Configuration (`.env`)

Located at `D:\DAK\current\.env` on the VM:

```env
# Server Network Settings
PORT=8080
HOSTNAME=0.0.0.0
NODE_ENV=production
NEXTAUTH_URL=http://10.70.12.73:8080
NEXTAUTH_SECRET=district-dak-offline-secret-production-key-2026

# PostgreSQL Database Connection
# Format: postgresql://<username>:<password>@<host>:<port>/<database>
DATABASE_URL=postgresql://postgres:your_password@127.0.0.1:5432/dak_monitoring

# Local Offline Storage Settings
STORAGE_PROVIDER=local
STORAGE_BUCKET=dak-attachments
STORAGE_LOCAL_ROOT=D:\DakServer\Storage
BACKUP_ROOT=D:\DakServer\Backups
STORAGE_SIGNED_URL_TTL=3600
```

> [!TIP]
> After modifying `.env`, restart the service by running `Restart-Service.bat` or `nssm restart DAKMonitoring`.

---

## 🛠️ Service Management Commands

Inside `D:\DAK\current\`, the following helper scripts are available:

| Batch Script | Purpose | Command Line Equivalent |
| :--- | :--- | :--- |
| `Status-Service.bat` | Check service status and test health endpoint | `tools\nssm status DAKMonitoring` |
| `Start-Service.bat` | Start the background service | `tools\nssm start DAKMonitoring` |
| `Stop-Service.bat` | Stop the background service | `tools\nssm stop DAKMonitoring` |
| `Restart-Service.bat` | Restart after config changes | `tools\nssm restart DAKMonitoring` |
| `Start-App-Console.bat` | Run in foreground for live console debugging | `node server.js` |
| `Uninstall-Service.bat` | Remove Windows Service registration | `tools\nssm remove DAKMonitoring confirm` |

---

## 🩺 Health Check & Monitoring

The application provides a dedicated, credential-safe health check API:

- **Endpoint**: `http://localhost:8080/api/health`
- **Expected Success Response** (HTTP 200):
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-03T06:45:00.000Z"
  }
  ```
- **Error Response** (HTTP 503):
  ```json
  {
    "status": "error",
    "message": "Health check failed"
  }
  ```

### Inspecting Runtime Logs

Logs are stored and automatically rotated inside `D:\DAK\current\logs\`:
- `logs\service-stdout.log` (Application standard output & access logs)
- `logs\service-stderr.log` (Application error logs & stack traces)

To view live logs in PowerShell:
```powershell
Get-Content -Path D:\DAK\current\logs\service-stdout.log -Wait -Tail 50
```

---

## 🌐 IIS Reverse Proxy Setup (Optional)

If client browsers access the VM on standard HTTP port 80 or 443 via IIS:

### Prerequisites:
1. Enable **IIS** on Windows Server.
2. Install **URL Rewrite** extension for IIS.
3. Install **Application Request Routing (ARR)** extension for IIS.
4. In IIS Manager -> Application Request Routing -> Server Proxy Settings -> Check **Enable proxy**.

### IIS `web.config` Configuration:

Place or merge the following inside your IIS website root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToDAK" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:8080/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="30000000" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

---

## 🗄️ Database Backup & Restore

### Backing Up the Database (`pg_dump`)
Run in PowerShell on the database server:
```powershell
$Date = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupFile = "D:\DakServer\Backups\dak_db_backup_$Date.sql"
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -d dak_monitoring -F p -f $BackupFile
```

### Restoring the Database (`psql`)
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d dak_monitoring -f "D:\DakServer\Backups\dak_db_backup_XXXXXXXX.sql"
```

---

## 🔄 Manual Rollback Procedure

If you ever need to manually revert to a previous working backup:

1. Stop the service:
   ```powershell
   D:\DAK\current\tools\nssm.exe stop DAKMonitoring
   ```
2. Identify the desired backup folder in `D:\DAK\backup\` (e.g. `D:\DAK\backup\DAK-Backup-20260903-120000`).
3. Replace `D:\DAK\current\` contents with the backup:
   ```powershell
   Remove-Item -Path "D:\DAK\current\*" -Recurse -Force
   Copy-Item -Path "D:\DAK\backup\DAK-Backup-20260903-120000\*" -Destination "D:\DAK\current\" -Recurse -Force
   ```
4. Start the service:
   ```powershell
   D:\DAK\current\tools\nssm.exe start DAKMonitoring
   ```
5. Verify health: `http://localhost:8080/api/health`.

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Port 8080 already in use** | Another service or application is occupying port 8080 | Run `netstat -ano \| findstr 8080` to identify PID, or change `PORT=8081` in `.env` and `deploy-dak.ps1 -Port 8081`. |
| **Database connection refused** | PostgreSQL service is stopped or wrong port in `DATABASE_URL` | Start PostgreSQL Windows service. Verify host/port in `.env` (e.g. 5432). Test via `node scripts\verify-database.mjs`. |
| **Missing table / schema error** | Migrations were not applied | Run `node scripts\db-migrate.mjs` inside `D:\DAK\current\`. |
| **Windows Service fails to start** | `node.exe` not found in PATH or bad permission on log folder | Open `logs\service-stderr.log`. Verify `node.exe` path in NSSM. |
