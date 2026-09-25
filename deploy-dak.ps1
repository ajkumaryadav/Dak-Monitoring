<#
.SYNOPSIS
    DAK Monitoring System - Offline Windows Server Production Deployment Script
.DESCRIPTION
    Performs automated, zero-downtime offline deployment on the Windows Server VM.
    Backs up existing application, safely executes database migrations,
    configures NSSM Windows Service, and runs HTTP health checks with auto-rollback.
.EXAMPLE
    .\deploy-dak.ps1 -Release .\DAK-Release-2026-09-03-1200.zip
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$Release = "",

    [Parameter(Mandatory = $false)]
    [string]$TargetRoot = "",

    [Parameter(Mandatory = $false)]
    [int]$Port = 0,

    [Parameter(Mandatory = $false)]
    [string]$ServiceName = "DAKMonitoring",

    [Parameter(Mandatory = $false)]
    [switch]$SkipMigration = $false
)

$ErrorActionPreference = "Stop"

function Write-Header {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host " DAK MONITORING SYSTEM - VM PRODUCTION DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
}

function Test-Admin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

Write-Header

# 0. Check Administrator Privileges
if (-not (Test-Admin)) {
    Write-Warning "This deployment script requires Administrator privileges for Windows Service configuration."
    Write-Host "Please re-run PowerShell as Administrator." -ForegroundColor Red
    exit 1
}

# 1. Locate Release ZIP & Auto-Detect TargetRoot
$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    $ScriptDir = (Get-Location).Path
}

if (-not $TargetRoot) {
    if (Test-Path "D:\") {
        $TargetRoot = "D:\DAK"
    } else {
        $TargetRoot = "C:\DAK"
    }
}

if (-not $Release) {
    # Try finding latest DAK-Release-*.zip in current directory
    $latestZip = Get-ChildItem -Path $ScriptDir -Filter "DAK-Release-*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestZip) {
        $Release = $latestZip.FullName
        Write-Host "Auto-detected release package: $Release" -ForegroundColor Green
    } else {
        Write-Error "No release package specified and no release ZIP found. Usage: .\deploy-dak.ps1 -Release .\DAK-Release.zip"
        exit 1
    }
}

$ReleasePath = Resolve-Path $Release -ErrorAction SilentlyContinue
if (-not $ReleasePath -or -not (Test-Path $ReleasePath)) {
    Write-Error "Release file not found at: $Release"
    exit 1
}

Write-Host "Release Package: $ReleasePath" -ForegroundColor Gray
Write-Host "Target Root:     $TargetRoot" -ForegroundColor Gray
Write-Host "Service Name:    $ServiceName" -ForegroundColor Gray
if ($Port -gt 0) {
    Write-Host "Target Port:     $Port (User specified)" -ForegroundColor Gray
}

# 2. Verify Prerequisites
Write-Host "`n[1/8] Verifying system prerequisites..." -ForegroundColor Yellow

# Detect Node.js
$NodeExe = ""
$nodeCommand = Get-Command "node" -ErrorAction SilentlyContinue
if ($nodeCommand) {
    $NodeExe = $nodeCommand.Source
} elseif (Test-Path "C:\Program Files\nodejs\node.exe") {
    $NodeExe = "C:\Program Files\nodejs\node.exe"
} elseif (Test-Path "C:\Program Files (x86)\nodejs\node.exe") {
    $NodeExe = "C:\Program Files (x86)\nodejs\node.exe"
}

if (-not $NodeExe) {
    Write-Error "Node.js executable not found! Please install Node.js (LTS version) on this VM."
    exit 1
}
$nodeVer = & $NodeExe -v
Write-Host "  Node.js detected: $NodeExe ($nodeVer)" -ForegroundColor Green

# Ensure Target Directory Structure Safely
$ReleasesDir = Join-Path $TargetRoot "releases"
$BackupDir   = Join-Path $TargetRoot "backup"
$DeployDir   = Join-Path $TargetRoot "deploy"
$CurrentDir  = Join-Path $TargetRoot "current"

foreach ($dir in @($TargetRoot, $ReleasesDir, $BackupDir, $DeployDir)) {
    if (-not (Test-Path $dir)) {
        try {
            [System.IO.Directory]::CreateDirectory($dir) | Out-Null
        } catch {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
}

# 3. Extract Release to Releases Directory
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$NewReleaseFolder = Join-Path $ReleasesDir "DAK-Release-$Timestamp"
Write-Host "`n[2/8] Extracting release to $NewReleaseFolder..." -ForegroundColor Yellow

if (-not (Test-Path $NewReleaseFolder)) {
    [System.IO.Directory]::CreateDirectory($NewReleaseFolder) | Out-Null
}
Expand-Archive -Path $ReleasePath -DestinationPath $NewReleaseFolder -Force
Write-Host "  Release extracted successfully." -ForegroundColor Green

# 4. Locate NSSM
$NssmExe = ""
$localNssm = Join-Path $NewReleaseFolder "tools\nssm.exe"
if (Test-Path $localNssm) {
    $NssmExe = $localNssm
} else {
    $nssmCommand = Get-Command "nssm" -ErrorAction SilentlyContinue
    if ($nssmCommand) {
        $NssmExe = $nssmCommand.Source
    } elseif (Test-Path "C:\tools\nssm.exe") {
        $NssmExe = "C:\tools\nssm.exe"
    }
}

if (-not $NssmExe) {
    Write-Error "NSSM service manager (nssm.exe) not found in release package or system PATH."
    exit 1
}
Write-Host "  NSSM detected: $NssmExe" -ForegroundColor Green

# 5. Environment Configuration
Write-Host "`n[3/8] Configuring runtime environment..." -ForegroundColor Yellow
$TargetEnvFile = Join-Path $NewReleaseFolder ".env.production"
$LocalEnvFile  = Join-Path $NewReleaseFolder ".env"

# If previous current release had an existing .env or .env.production, preserve it
$ExistingEnv = Join-Path $CurrentDir ".env"
$ExistingProdEnv = Join-Path $CurrentDir ".env.production"

if (Test-Path $ExistingEnv) {
    Write-Host "  Preserving existing production .env from active deployment..." -ForegroundColor Green
    Copy-Item -Path $ExistingEnv -Destination $LocalEnvFile -Force
    Copy-Item -Path $ExistingEnv -Destination $TargetEnvFile -Force
} elseif (Test-Path $ExistingProdEnv) {
    Write-Host "  Preserving existing production .env.production..." -ForegroundColor Green
    Copy-Item -Path $ExistingProdEnv -Destination $LocalEnvFile -Force
    Copy-Item -Path $ExistingProdEnv -Destination $TargetEnvFile -Force
} else {
    Write-Host "  Initializing new production environment from template..." -ForegroundColor Gray
    if (Test-Path "$NewReleaseFolder\.env.example") {
        Copy-Item -Path "$NewReleaseFolder\.env.example" -Destination $LocalEnvFile -Force
        Copy-Item -Path "$NewReleaseFolder\.env.example" -Destination $TargetEnvFile -Force
    }
}

# Auto-correct old port 5433 to standard 5432 if present
foreach ($envFile in @($LocalEnvFile, $TargetEnvFile)) {
    if (Test-Path $envFile) {
        $envContent = Get-Content -Path $envFile -Raw
        if ($envContent -match ":5433/") {
            $envContent = $envContent -replace ":5433/", ":5432/"
            Set-Content -Path $envFile -Value $envContent -Force
            Write-Host "  Auto-corrected PostgreSQL port from 5433 to 5432 in $(Split-Path $envFile -Leaf)." -ForegroundColor Green
        }
    }
}

# Resolve runtime port if not explicitly set
if ($Port -le 0) {
    foreach ($envFile in @($TargetEnvFile, $LocalEnvFile)) {
        if (Test-Path $envFile) {
            $envMatch = Select-String -Path $envFile -Pattern "^PORT=(\d+)" | Select-Object -First 1
            if ($envMatch -and $envMatch.Matches.Groups[1].Value) {
                $Port = [int]$envMatch.Matches.Groups[1].Value
                break
            }
        }
    }
    if ($Port -le 0) {
        $Port = 80
    }
}
Write-Host "  Configured Runtime Port: $Port" -ForegroundColor Green

# Remove any lingering .env.local in release folder
if (Test-Path (Join-Path $NewReleaseFolder ".env.local")) {
    Remove-Item -Path (Join-Path $NewReleaseFolder ".env.local") -Force -ErrorAction SilentlyContinue
}

# 6. Database Migration
if (-not $SkipMigration) {
    Write-Host "`n[4/8] Running database migrations..." -ForegroundColor Yellow
    $MigrateScript = Join-Path $NewReleaseFolder "scripts\db-migrate.mjs"
    if (Test-Path $MigrateScript) {
        $migrateProcess = Start-Process -FilePath $NodeExe -ArgumentList "`"$MigrateScript`"" -WorkingDirectory $NewReleaseFolder -NoNewWindow -PassThru -Wait
        if ($migrateProcess.ExitCode -ne 0) {
            Write-Error "Database migration failed with exit code $($migrateProcess.ExitCode)! Aborting deployment."
            exit 1
        }
        Write-Host "  Database migrations applied successfully." -ForegroundColor Green
    } else {
        Write-Warning "Migration script not found at $MigrateScript, skipping."
    }
} else {
    Write-Host "`n[4/8] Skipping database migrations (-SkipMigration requested)." -ForegroundColor Gray
}

# 7. Stop Existing Service & Backup Current Deployment
Write-Host "`n[5/8] Managing existing service and creating backup..." -ForegroundColor Yellow

$serviceExists = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($serviceExists) {
    Write-Host "  Stopping existing service '$ServiceName'..." -ForegroundColor Gray
    & $NssmExe stop $ServiceName *>$null
    Start-Sleep -Seconds 2
}

$PreviousBackupFolder = ""
if (Test-Path $CurrentDir) {
    $PreviousBackupFolder = Join-Path $BackupDir "DAK-Backup-$Timestamp"
    Write-Host "  Backing up active deployment to $PreviousBackupFolder..." -ForegroundColor Gray
    Copy-Item -Path $CurrentDir -Destination $PreviousBackupFolder -Recurse -Force
}

# 8. Deploy New Release to Current Directory
Write-Host "`n[6/8] Deploying release files to $CurrentDir..." -ForegroundColor Yellow
if (Test-Path $CurrentDir) {
    Remove-Item -Path "$CurrentDir\*" -Recurse -Force -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Path $CurrentDir -Force | Out-Null
}

Copy-Item -Path "$NewReleaseFolder\*" -Destination $CurrentDir -Recurse -Force
New-Item -ItemType Directory -Path "$CurrentDir\logs" -Force | Out-Null
Write-Host "  Files deployed to current runtime directory." -ForegroundColor Green

# 9. Configure Windows Firewall & Start Windows Service
Write-Host "`n[7/8] Configuring Windows Firewall and Service '$ServiceName'..." -ForegroundColor Yellow

# Ensure Windows Firewall rules
try {
    if (-not (Get-NetFirewallRule -DisplayName "DAK-Monitoring-HTTP" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "DAK-Monitoring-HTTP" -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow | Out-Null
    }
    Write-Host "  Firewall rule for Port $Port (HTTP) configured." -ForegroundColor Green
} catch {
    Write-Host "  Firewall rule notice: $($_.Exception.Message)" -ForegroundColor Gray
}

$CurrentNssm = Join-Path $CurrentDir "tools\nssm.exe"
if (-not (Test-Path $CurrentNssm)) {
    $CurrentNssm = $NssmExe
}

$EntryScript = "server.js"

# Register or reconfigure service
if (-not $serviceExists) {
    Write-Host "  Installing new Windows Service '$ServiceName'..." -ForegroundColor Gray
    & $CurrentNssm install $ServiceName "$NodeExe" "$EntryScript"
}

# Configure service properties
& $CurrentNssm set $ServiceName AppDirectory "$CurrentDir"
& $CurrentNssm set $ServiceName Application "$NodeExe"
& $CurrentNssm set $ServiceName AppParameters "$EntryScript"
& $CurrentNssm set $ServiceName AppEnvironmentExtra "PORT=$Port" "HOSTNAME=0.0.0.0" "NODE_ENV=production"
& $CurrentNssm set $ServiceName AppStdout "$CurrentDir\logs\service-stdout.log"
& $CurrentNssm set $ServiceName AppStderr "$CurrentDir\logs\service-stderr.log"
& $CurrentNssm set $ServiceName AppRotateFiles 1
& $CurrentNssm set $ServiceName AppRotateOnline 1
& $CurrentNssm set $ServiceName AppRotateSeconds 86400
& $CurrentNssm set $ServiceName AppRotateBytes 10485760
& $CurrentNssm set $ServiceName AppRestartDelay 3000

# Start service
Write-Host "  Starting Windows Service '$ServiceName' on Port $Port..." -ForegroundColor Gray
& $CurrentNssm start $ServiceName
Start-Sleep -Seconds 4

# 10. Health Check & Auto-Rollback
Write-Host "`n[8/8] Performing health check..." -ForegroundColor Yellow
$HealthUrl = "http://127.0.0.1:$Port/api/health"
$HealthPassed = $false

for ($i = 1; $i -le 10; $i++) {
    Write-Host "  [Attempt $i/10] Querying $HealthUrl ..." -ForegroundColor Gray
    try {
        $response = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($response.status -eq "ok") {
            $HealthPassed = $true
            Write-Host "  Health check OK: Server is healthy and responding!" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $HealthPassed) {
    Write-Host "`n[FATAL] Health check failed on port $Port!" -ForegroundColor Red
    Write-Host "Checking service error logs..." -ForegroundColor Yellow
    $errLog = Join-Path $CurrentDir "logs\service-stderr.log"
    if (Test-Path $errLog) {
        Get-Content $errLog -Tail 20 | Write-Host -ForegroundColor DarkRed
    }

    if ($PreviousBackupFolder -and (Test-Path $PreviousBackupFolder)) {
        Write-Warning "Initiating automatic rollback to previous working release..."
        & $CurrentNssm stop $ServiceName *>$null
        Remove-Item -Path "$CurrentDir\*" -Recurse -Force -ErrorAction SilentlyContinue
        Copy-Item -Path "$PreviousBackupFolder\*" -Destination $CurrentDir -Recurse -Force
        & $CurrentNssm start $ServiceName
        Write-Host "Rollback completed. Service restored to previous release." -ForegroundColor Yellow
    }
    exit 1
}

# Determine Host IP
$HostIP = "10.70.233.176"
try {
    $ipObj = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169\." } | Select-Object -First 1
    if ($ipObj) { $HostIP = $ipObj.IPAddress }
} catch {}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] DAK MONITORING SYSTEM DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Service Name:     $ServiceName" -ForegroundColor White
Write-Host "Service Status:   Running (Auto-Start)" -ForegroundColor White
Write-Host "Local URL:        http://localhost:$Port" -ForegroundColor White
Write-Host "LAN URL:          http://${HostIP}:$Port" -ForegroundColor Green
Write-Host "Health Endpoint:  http://${HostIP}:$Port/api/health" -ForegroundColor White
Write-Host "Logs Directory:   $CurrentDir\logs" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
