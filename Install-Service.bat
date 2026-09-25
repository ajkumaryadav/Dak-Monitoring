@echo off
setlocal EnableDelayedExpansion

:: Auto-Elevate to Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

set "SERVICE_NAME=DAKMonitoring"
set "NSSM_EXE=%APP_DIR%\tools\nssm.exe"

if not exist "%NSSM_EXE%" (
    for /f "delims=" %%i in ('where nssm.exe 2^>nul') do set "NSSM_EXE=%%i"
)

if not exist "%NSSM_EXE%" (
    echo [ERROR] nssm.exe not found at %APP_DIR%\tools\nssm.exe or PATH!
    pause
    exit /b 1
)

:: Detect Node.js
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
    for /f "delims=" %%i in ('where node.exe 2^>nul') do set "NODE_EXE=%%i"
)

if not exist "%NODE_EXE%" (
    echo [ERROR] node.exe not found! Please install Node.js.
    pause
    exit /b 1
)

if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"

:: Detect Port from .env or default to 80
set "APP_PORT=80"
if exist "%APP_DIR%\.env" (
    for /f "tokens=1,2 delims==" %%a in ('findstr /r "^PORT=" "%APP_DIR%\.env" 2^>nul') do (
        set "APP_PORT=%%b"
    )
)
if exist "%APP_DIR%\.env.production" (
    for /f "tokens=1,2 delims==" %%a in ('findstr /r "^PORT=" "%APP_DIR%\.env.production" 2^>nul') do (
        set "APP_PORT=%%b"
    )
)

set "ENTRY_SCRIPT=server.js"

echo ====================================================
echo  DAK MONITORING SYSTEM — ONE-CLICK HTTP SERVICE
echo  Directory: %APP_DIR%
echo  Node:      %NODE_EXE%
echo  App:       %ENTRY_SCRIPT%
echo  HTTP Port: %APP_PORT% (0.0.0.0)
echo ====================================================
echo.

:: 1. Open Windows Firewall ports
echo [1/4] Ensuring Windows Firewall rule for HTTP (%APP_PORT%)...
netsh advfirewall firewall add rule name="DAK-Monitoring-HTTP" dir=in action=allow protocol=TCP localport=%APP_PORT% >nul 2>&1

:: 2. Stop existing service before database repair
echo [2/4] Stopping existing Windows Service if running...
"%NSSM_EXE%" stop %SERVICE_NAME% >nul 2>&1
timeout /t 2 >nul

:: 3. Synchronize and repair database schema
echo [3/4] Synchronizing database tables, columns, and views...
if exist "%APP_DIR%\quick-fix-database.mjs" (
    "%NODE_EXE%" "%APP_DIR%\quick-fix-database.mjs"
) else if exist "%APP_DIR%\scripts\db-migrate.mjs" (
    "%NODE_EXE%" "%APP_DIR%\scripts\db-migrate.mjs"
)

:: 4. Configure Windows Service with NSSM
echo.
echo [4/4] Configuring and starting %SERVICE_NAME% Windows Service...
"%NSSM_EXE%" install %SERVICE_NAME% "%NODE_EXE%" "%ENTRY_SCRIPT%" >nul 2>&1
"%NSSM_EXE%" set %SERVICE_NAME% AppDirectory "%APP_DIR%"
"%NSSM_EXE%" set %SERVICE_NAME% Application "%NODE_EXE%"
"%NSSM_EXE%" set %SERVICE_NAME% AppParameters "%ENTRY_SCRIPT%"
"%NSSM_EXE%" set %SERVICE_NAME% AppEnvironmentExtra "PORT=%APP_PORT%" "HOSTNAME=0.0.0.0" "NODE_ENV=production"
"%NSSM_EXE%" set %SERVICE_NAME% AppStdout "%APP_DIR%\logs\service-stdout.log"
"%NSSM_EXE%" set %SERVICE_NAME% AppStderr "%APP_DIR%\logs\service-stderr.log"
"%NSSM_EXE%" set %SERVICE_NAME% AppRotateFiles 1
"%NSSM_EXE%" set %SERVICE_NAME% AppRotateOnline 1
"%NSSM_EXE%" set %SERVICE_NAME% AppRotateSeconds 86400
"%NSSM_EXE%" set %SERVICE_NAME% AppRotateBytes 10485760
"%NSSM_EXE%" set %SERVICE_NAME% AppRestartDelay 3000

"%NSSM_EXE%" start %SERVICE_NAME%
timeout /t 3 >nul

echo.
echo ====================================================
echo [Service Status]
"%NSSM_EXE%" status %SERVICE_NAME%
echo.
echo  Service is running!
echo  LAN URL:   http://10.70.233.176
echo  Local URL: http://localhost:%APP_PORT%
echo ====================================================
pause
