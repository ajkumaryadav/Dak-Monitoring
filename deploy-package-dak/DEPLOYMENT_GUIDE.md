# DISTRICT DAK MONITORING SYSTEM (DDMS)
## Offline Deployment & Operations Guide for Host 10.70.233.176

This package contains the fully pre-built and self-contained District DAK Monitoring System.
No internet connection or `npm install` is required on the target server.

---

## 📋 Target Server Prerequisites
1. **Operating System**: Windows Server / Windows 10 / Windows 11
2. **Node.js**: Installed (Node.js 18.x, 20.x, or 22.x)
3. **PostgreSQL**: Installed and running (Default port: 5432)
4. **LAN IP**: `10.70.233.176` (or accessible via host IP)

---

## 🚀 Step-by-Step Zero-Failure Deployment

### STEP 1: Copy Folder to Target VM
Copy the entire `deploy-package-dak` folder to your desired drive on the server VM, for example:
```text
D:\Dak-Monitoring
```
*(or C:\Dak-Monitoring)*

---

### STEP 2: Configure Environment (.env.local)
Open `.env.local` in Notepad and ensure your PostgreSQL credentials and server URL are set:
```env
PORT=3050
HOSTNAME=0.0.0.0
NEXTAUTH_URL=http://10.70.233.176:3050

# PostgreSQL Connection String:
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/postgres

# Storage Settings (Uses local disk for attachments in offline mode):
STORAGE_PROVIDER=local
STORAGE_LOCAL_ROOT=D:\DakServer\Storage
BACKUP_ROOT=D:\DakServer\Backups
```

---

### STEP 3: Verify & Setup Database
1. Right-click **`1-Setup-or-Migrate-Database.bat`** and select **Run as administrator**.
   - This automatically runs the complete consolidated schema (`00_full_schema_and_seed.sql`) and applies all 39 migrations.
2. Run **`2-Verify-Database.bat`** to execute the database integrity test.
   - You should see `[PASS] Database schema is 100% complete and healthy!` for all 25 tables.

---

### STEP 4: Install & Start Windows Service
Right-click **`3-Install-Service.bat`** and select **Run as administrator**.
- This registers `DakMonitoring` as an auto-recovering Windows Service using bundled NSSM.
- Starts the application immediately on **Port 3050** bound to **0.0.0.0**.

---

### STEP 5: Access the Application
Open your browser on the host machine or LAN client:
```text
http://10.70.233.176:3050
```

---

## 🛠️ Operational Commands (Batch Scripts)

| Script | Purpose |
| :--- | :--- |
| **`Start-App-Console.bat`** | Run the app interactively in a command prompt window (useful for instant debugging). |
| **`Status-Service.bat`** | Check if the Windows Service is running and test HTTP connectivity. |
| **`Restart-Service.bat`** | Restart the Windows Service after configuration changes. |
| **`Stop-Service.bat`** | Stop the Windows Service. |
| **`Uninstall-Service.bat`** | Completely remove the Windows Service registration. |
| **`Run-SLA-Monitor.bat`** | Execute SLA breach checks and escalation processing (can be scheduled in Windows Task Scheduler). |

---

## 📂 Log Locations
- Service Stdout Log: `logs\service-stdout.log`
- Service Stderr Log: `logs\service-stderr.log`
