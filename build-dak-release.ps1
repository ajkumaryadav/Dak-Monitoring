[CmdletBinding()]
param(
    [string]$OutputDir = "releases"
)

$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot
if (-not $RootDir) {
    $RootDir = (Get-Location).Path
}
Set-Location $RootDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " DAK MONITORING SYSTEM - PRODUCTION OFFLINE BUILD SYSTEM" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Source Directory: $RootDir" -ForegroundColor Gray

# 1. Clean previous build artifacts
Write-Host ""
Write-Host "[1/7] Cleaning previous build artifacts..." -ForegroundColor Yellow
if (Test-Path "$RootDir\.next\standalone") {
    try {
        Remove-Item -Path "$RootDir\.next\standalone" -Recurse -Force -ErrorAction SilentlyContinue
    } catch {}
}
$StagingDir = "$RootDir\.release-staging"
if (Test-Path $StagingDir) {
    try {
        Get-ChildItem -Path $StagingDir -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
        Remove-Item -Path $StagingDir -Recurse -Force -ErrorAction SilentlyContinue
    } catch {}
}
if (-not (Test-Path $StagingDir)) {
    New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null
}

$FullOutputDir = Join-Path $RootDir $OutputDir
if (-not (Test-Path $FullOutputDir)) {
    New-Item -ItemType Directory -Path $FullOutputDir -Force | Out-Null
}

# 2. Run Next.js production build
Write-Host ""
Write-Host "[2/7] Running Next.js standalone production build..." -ForegroundColor Yellow

Write-Host "Executing 'npm run build'..." -ForegroundColor Gray
$env:PATH = "C:\Program Files\nodejs;C:\Users\hp\AppData\Roaming\npm;" + $env:PATH
$env:NODE_OPTIONS = "--max-old-space-size=4096"
& cmd.exe /c "npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Next.js production build failed with exit code $LASTEXITCODE!"
    exit 1
}

# 3. Verify standalone build artifacts
Write-Host ""
Write-Host "[3/7] Verifying standalone build output..." -ForegroundColor Yellow
$StandaloneDir = "$RootDir\.next\standalone"
if (-not (Test-Path $StandaloneDir)) {
    Write-Error "Standalone directory '.next\standalone' not found! Check output: 'standalone' in next.config.ts."
    exit 1
}

$ServerJsPath = Get-ChildItem -Path $StandaloneDir -Filter "server.js" -Recurse | Select-Object -First 1
if (-not $ServerJsPath) {
    Write-Error "server.js was not found in standalone output!"
    exit 1
}
Write-Host "  Found server.js at: $($ServerJsPath.FullName)" -ForegroundColor Green

# 4. Assemble the standalone package
Write-Host ""
Write-Host "[4/7] Assembling standalone runtime files in staging folder..." -ForegroundColor Yellow

$ServerRootDir = $ServerJsPath.Directory.FullName
Copy-Item -Path "$ServerRootDir\*" -Destination $StagingDir -Recurse -Force

# Strip non-runtime bulky folders and archives from staging
$BloatFolders = @("releases", "db backup", "security audit", ".git")
foreach ($folder in $BloatFolders) {
    $targetPath = Join-Path $StagingDir $folder
    if (Test-Path $targetPath) {
        Remove-Item -Path $targetPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Get-ChildItem -Path $StagingDir -Include "*.zip", "*.pdf", "*.tar", "*.gz" -Recurse -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "  Copying static assets (.next\static)..." -ForegroundColor Gray
$TargetStaticDir = "$StagingDir\.next\static"
New-Item -ItemType Directory -Path $TargetStaticDir -Force | Out-Null
Copy-Item -Path "$RootDir\.next\static\*" -Destination $TargetStaticDir -Recurse -Force

if (Test-Path "$RootDir\public") {
    Write-Host "  Copying public assets..." -ForegroundColor Gray
    $TargetPublicDir = "$StagingDir\public"
    New-Item -ItemType Directory -Path $TargetPublicDir -Force | Out-Null
    Copy-Item -Path "$RootDir\public\*" -Destination $TargetPublicDir -Recurse -Force
}

Write-Host "  Copying database schemas and migration runner..." -ForegroundColor Gray
$TargetSupabaseDir = "$StagingDir\supabase"
New-Item -ItemType Directory -Path $TargetSupabaseDir -Force | Out-Null
Copy-Item -Path "$RootDir\supabase\*" -Destination $TargetSupabaseDir -Recurse -Force

$TargetScriptsDir = "$StagingDir\scripts"
New-Item -ItemType Directory -Path $TargetScriptsDir -Force | Out-Null
Copy-Item -Path "$RootDir\scripts\*" -Destination $TargetScriptsDir -Recurse -Force

if (Test-Path "$RootDir\tools") {
    Write-Host "  Copying tools (NSSM)..." -ForegroundColor Gray
    $TargetToolsDir = "$StagingDir\tools"
    New-Item -ItemType Directory -Path $TargetToolsDir -Force | Out-Null
    Copy-Item -Path "$RootDir\tools\*" -Destination $TargetToolsDir -Recurse -Force
}

if (Test-Path "$RootDir\certificates") {
    Write-Host "  Copying TLS certificates..." -ForegroundColor Gray
    $TargetCertDir = "$StagingDir\certificates"
    New-Item -ItemType Directory -Path $TargetCertDir -Force | Out-Null
    Copy-Item -Path "$RootDir\certificates\*" -Destination $TargetCertDir -Recurse -Force
}

Write-Host "  Configuring environment templates..." -ForegroundColor Gray
if (Test-Path "$StagingDir\.env.local") {
    Remove-Item -Path "$StagingDir\.env.local" -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$RootDir\.env.production") {
    Copy-Item -Path "$RootDir\.env.production" -Destination "$StagingDir\.env.production" -Force
    Copy-Item -Path "$RootDir\.env.production" -Destination "$StagingDir\.env.example" -Force
}

Write-Host "  Copying deployment scripts and documentation..." -ForegroundColor Gray
$FilesToCopy = @(
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
    "quick-fix-database.mjs"
)

foreach ($file in $FilesToCopy) {
    if (Test-Path "$RootDir\$file") {
        try {
            Copy-Item -Path "$RootDir\$file" -Destination "$StagingDir\$file" -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}

New-Item -ItemType Directory -Path "$StagingDir\logs" -Force | Out-Null

# 5. Create timestamped release archive
Write-Host ""
Write-Host "[5/7] Creating compressed offline release ZIP..." -ForegroundColor Yellow
$Timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$ZipFileName = "DAK-Release-$Timestamp.zip"
$ZipFilePath = Join-Path $FullOutputDir $ZipFileName

if (Test-Path $ZipFilePath) {
    Remove-Item -Path $ZipFilePath -Force
}

if (Get-Command "tar.exe" -ErrorAction SilentlyContinue) {
    Push-Location $StagingDir
    & tar.exe -a -c -f $ZipFilePath *
    Pop-Location
} else {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($StagingDir, $ZipFilePath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
}

# 6. Checksum and release verification
Write-Host ""
Write-Host "[6/7] Computing release checksum and size..." -ForegroundColor Yellow
$ZipItem = Get-Item $ZipFilePath
$ZipSizeMB = [math]::Round($ZipItem.Length / 1MB, 2)
$Sha256 = (Get-FileHash -Path $ZipFilePath -Algorithm SHA256).Hash

Write-Host "  Package:  $ZipFileName" -ForegroundColor Green
Write-Host "  Size:     $ZipSizeMB MB" -ForegroundColor Green
Write-Host "  SHA-256:  $Sha256" -ForegroundColor Green

# Also ensure deploy-dak.ps1 and guide are placed in releases/ output folder
Copy-Item -Path "$RootDir\deploy-dak.ps1" -Destination (Join-Path $FullOutputDir "deploy-dak.ps1") -Force
if (Test-Path "$RootDir\OFFLINE-DEPLOYMENT.md") {
    Copy-Item -Path "$RootDir\OFFLINE-DEPLOYMENT.md" -Destination (Join-Path $FullOutputDir "OFFLINE-DEPLOYMENT.md") -Force
}

# 7. Cleanup staging directory
Write-Host ""
Write-Host "[7/7] Cleaning up temporary staging files..." -ForegroundColor Yellow
Remove-Item -Path $StagingDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] PRODUCTION RELEASE PACKAGE CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Release Location: $ZipFilePath" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Transfer '$ZipFileName' to the offline Windows Server VM." -ForegroundColor Gray
Write-Host "2. On the VM, run in PowerShell (Administrator):" -ForegroundColor Gray
Write-Host "   .\deploy-dak.ps1 -Release .\$ZipFileName" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
