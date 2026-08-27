# PowerShell script to register and configure DakMonitoring NSSM service
$ErrorActionPreference = "Stop"

$appDir = "D:\aj\Dak-Monitoring"
$nodeExe = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodeExe)) {
    $nodeExe = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
}
$nssmExe = "D:\aj\Tools\nssm.exe"
if (-not (Test-Path $nssmExe)) {
    $nssmExe = (Get-Command nssm.exe -ErrorAction SilentlyContinue).Source
}

$nextBin = Join-Path $appDir "node_modules\next\dist\bin\next"
$logsDir = Join-Path $appDir "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$stdoutLog = Join-Path $logsDir "service-stdout.log"
$stderrLog = Join-Path $logsDir "service-stderr.log"

Write-Host "Stopping and resetting service..." -ForegroundColor Yellow
& $nssmExe stop DakMonitoring 2>$null | Out-Null
& $nssmExe remove DakMonitoring confirm 2>$null | Out-Null

Write-Host "Installing DakMonitoring service..." -ForegroundColor Cyan
& $nssmExe install DakMonitoring "$nodeExe" "`"$nextBin`" start --port 3050 --hostname 0.0.0.0"

Write-Host "Configuring parameters..." -ForegroundColor Cyan
& $nssmExe set DakMonitoring AppDirectory "$appDir"
& $nssmExe set DakMonitoring AppStdout "$stdoutLog"
& $nssmExe set DakMonitoring AppStderr "$stderrLog"
& $nssmExe set DakMonitoring AppRotateFiles 1
& $nssmExe set DakMonitoring AppRotateBytes 10485760
& $nssmExe set DakMonitoring AppRestartDelay 5000
& $nssmExe set DakMonitoring AppEnvironmentExtra "PORT=3050`nNODE_ENV=production`nHOSTNAME=0.0.0.0"

Write-Host "Starting DakMonitoring service..." -ForegroundColor Green
& $nssmExe start DakMonitoring

Start-Sleep -Seconds 3
& $nssmExe status DakMonitoring
