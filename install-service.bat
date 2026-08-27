@echo off
setlocal EnableDelayedExpansion

:: 1. Auto-Elevate to Administrator if not already elevated
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ====================================================
    echo  Requesting Administrator Privileges...
    echo ====================================================
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

:: Get clean directory without trailing backslash
set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

echo ====================================================
echo  Installing Dak-Monitoring as Windows Service
echo  Directory: %APP_DIR%
echo  Port:      3050
echo ====================================================
echo.

:: Detect NSSM
set "NSSM_EXE=D:\aj\Tools\nssm.exe"
if not exist "%NSSM_EXE%" (
    for /f "delims=" %%i in ('where nssm.exe 2^>nul') do set "NSSM_EXE=%%i"
)
if not exist "%NSSM_EXE%" (
    echo [ERROR] nssm.exe not found! Please ensure NSSM is in D:\aj\Tools or in PATH.
    pause
    exit /b 1
)

:: Detect Node
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
    for /f "delims=" %%i in ('where node.exe 2^>nul') do set "NODE_EXE=%%i"
)
if not exist "%NODE_EXE%" (
    echo [ERROR] node.exe not found!
    pause
    exit /b 1
)

set "NEXT_BIN=%APP_DIR%\node_modules\next\dist\bin\next"
if not exist "%NEXT_BIN%" (
    echo [ERROR] Next.js binary not found at %NEXT_BIN%!
    echo Please run 'npm install' first.
    pause
    exit /b 1
)

:: Create logs directory
if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"

echo [1/3] Building Next.js production build...
call npm run build
if %errorLevel% neq 0 (
    echo [ERROR] Build failed! Aborting service installation.
    pause
    exit /b %errorLevel%
)

echo.
echo [2/3] Registering and configuring NSSM Windows Service...
"%NSSM_EXE%" stop DakMonitoring >nul 2>&1
"%NSSM_EXE%" remove DakMonitoring confirm >nul 2>&1

"%NSSM_EXE%" install DakMonitoring "%NODE_EXE%" "\"%NEXT_BIN%\" start --port 3050 --hostname 0.0.0.0"
"%NSSM_EXE%" set DakMonitoring AppDirectory "%APP_DIR%"
"%NSSM_EXE%" set DakMonitoring AppStdout "%APP_DIR%\logs\service-stdout.log"
"%NSSM_EXE%" set DakMonitoring AppStderr "%APP_DIR%\logs\service-stderr.log"
"%NSSM_EXE%" set DakMonitoring AppRotateFiles 1
"%NSSM_EXE%" set DakMonitoring AppRotateBytes 10485760
"%NSSM_EXE%" set DakMonitoring AppRestartDelay 5000
"%NSSM_EXE%" set DakMonitoring AppEnvironmentExtra "PORT=3050" "NODE_ENV=production" "HOSTNAME=0.0.0.0"

echo.
echo [3/3] Starting DakMonitoring service...
"%NSSM_EXE%" start DakMonitoring

echo.
echo ====================================================
echo  Service 'DakMonitoring' successfully configured!
echo  Port: 3050
echo  URL:  http://localhost:3050
echo  Logs: %APP_DIR%\logs
echo ====================================================
echo.
pause
