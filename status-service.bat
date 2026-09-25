@echo off
setlocal EnableDelayedExpansion

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

set "SERVICE_NAME=DAKMonitoring"
set "NSSM_EXE=%APP_DIR%\tools\nssm.exe"
if not exist "%NSSM_EXE%" (
    for /f "delims=" %%i in ('where nssm.exe 2^>nul') do set "NSSM_EXE=%%i"
)

echo ====================================================
echo  %SERVICE_NAME% Service Status
echo ====================================================
"%NSSM_EXE%" status %SERVICE_NAME%

echo.
echo Checking HTTP Health Check on Port 8080...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/api/health' -TimeoutSec 3; Write-Host 'Health check response:' -ForegroundColor Green; $r | ConvertTo-Json } catch { Write-Host 'Health check failed:' $_.Exception.Message -ForegroundColor Red }"

echo.
pause
