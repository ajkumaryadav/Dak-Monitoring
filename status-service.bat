@echo off
setlocal

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

set "SERVICE_NAME=DakMonitoring"
set "NSSM_EXE=%APP_DIR%\tools\nssm.exe"

if not exist "%NSSM_EXE%" (
    for /f "delims=" %%i in ('where nssm.exe 2^>nul') do set "NSSM_EXE=%%i"
)

echo ====================================================
echo  DakMonitoring Windows Service Status Check
echo ====================================================

if exist "%NSSM_EXE%" (
    echo [NSSM Status]
    "%NSSM_EXE%" status %SERVICE_NAME%
) else (
    echo [NSSM binary not found at %NSSM_EXE%]
)

echo.
echo [Checking Port 3050 Listener]
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3050 -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, State, OwningProcess | Format-Table -AutoSize"

echo.
echo [Testing HTTP Response on http://localhost:3050]
powershell -NoProfile -Command "try { $res = Invoke-WebRequest -Uri 'http://localhost:3050' -UseBasicParsing -TimeoutSec 5; Write-Host ('HTTP Status: ' + $res.StatusCode + ' OK') -ForegroundColor Green } catch { Write-Host ('HTTP Probe Error: ' + $_.Exception.Message) -ForegroundColor Red }"

echo.
echo [Recent Service Error Logs (last 20 lines)]
if exist "%APP_DIR%\logs\service-stderr.log" (
    powershell -NoProfile -Command "Get-Content -Path '%APP_DIR%\logs\service-stderr.log' -Tail 20"
) else (
    echo No error logs found.
)

echo.
pause
