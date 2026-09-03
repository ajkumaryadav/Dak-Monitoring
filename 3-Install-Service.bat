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

set "SERVICE_NAME=DakMonitoring"
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
    echo [ERROR] node.exe not found! Please install Node.js (LTS).
    pause
    exit /b 1
)

set "NEXT_BIN=%APP_DIR%\node_modules\next\dist\bin\next"
if not exist "%NEXT_BIN%" (
    echo [ERROR] Next.js binary not found at %NEXT_BIN%!
    echo Run 'npm install' first.
    pause
    exit /b 1
)

if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"

echo ====================================================
echo  Installing/Reconfiguring %SERVICE_NAME% Windows Service
echo  Directory: %APP_DIR%
echo  Node:      %NODE_EXE%
echo  Next Bin:  %NEXT_BIN%
echo  Port:      3050 (0.0.0.0)
echo ====================================================
echo.

:: Build production bundle if .next does not exist or was wiped by dev
if not exist "%APP_DIR%\.next\required-server-files.json" (
    echo [Building Next.js production bundle...]
    call npm run build
    if %errorLevel% neq 0 (
        echo [ERROR] Build failed! Fix build errors before installing service.
        pause
        exit /b 1
    )
)

:: Stop existing service if running
"%NSSM_EXE%" stop %SERVICE_NAME% >nul 2>&1
timeout /t 2 >nul

:: Install / Update service configuration
"%NSSM_EXE%" install %SERVICE_NAME% "%NODE_EXE%" "\"%NEXT_BIN%\" start --port 3050 --hostname 0.0.0.0"
"%NSSM_EXE%" set %SERVICE_NAME% AppDirectory "%APP_DIR%"
"%NSSM_EXE%" set %SERVICE_NAME% AppParameters "\"%NEXT_BIN%\" start --port 3050 --hostname 0.0.0.0"
"%NSSM_EXE%" set %SERVICE_NAME% AppEnvironmentExtra "PORT=3050" "HOSTNAME=0.0.0.0" "NODE_ENV=production"
"%NSSM_EXE%" set %SERVICE_NAME% AppStdout "%APP_DIR%\logs\service-stdout.log"
"%NSSM_EXE%" set %SERVICE_NAME% AppStderr "%APP_DIR%\logs\service-stderr.log"
"%NSSM_EXE%" set %SERVICE_NAME% AppRotateFiles 1
"%NSSM_EXE%" set %SERVICE_NAME% AppRotateOnline 1
"%NSSM_EXE%" set %SERVICE_NAME% AppRotateSeconds 86400
"%NSSM_EXE%" set %SERVICE_NAME% AppRotateBytes 10485760
"%NSSM_EXE%" set %SERVICE_NAME% AppRestartDelay 3000

echo.
echo [Starting Service %SERVICE_NAME%...]
"%NSSM_EXE%" start %SERVICE_NAME%
timeout /t 3 >nul

echo.
echo [Service Status]
"%NSSM_EXE%" status %SERVICE_NAME%

echo.
echo ====================================================
echo  Service installed and started!
echo  URL: http://localhost:3050 (or http://10.70.12.73:3050)
echo ====================================================
pause
