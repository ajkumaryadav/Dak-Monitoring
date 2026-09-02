@echo off
setlocal

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

set "NSSM_EXE=%APP_DIR%\tools\nssm.exe"
if not exist "%NSSM_EXE%" set "NSSM_EXE=D:\aj\Tools\nssm.exe"
if not exist "%NSSM_EXE%" (
    for /f "delims=" %%i in ('where nssm.exe 2^>nul') do set "NSSM_EXE=%%i"
)

echo ====================================================
echo  DakMonitoring Windows Service Status Check
echo ====================================================

if exist "%NSSM_EXE%" (
    echo [NSSM Status]
    "%NSSM_EXE%" status DakMonitoring
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
pause
