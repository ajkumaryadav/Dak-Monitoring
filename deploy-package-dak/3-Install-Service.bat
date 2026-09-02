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
echo  Host / Port: 0.0.0.0:3050
echo ====================================================
echo.

:: Detect NSSM (bundled in tools\ first, then D:\aj\Tools, then PATH)
set "NSSM_EXE=%APP_DIR%\tools\nssm.exe"
if not exist "%NSSM_EXE%" set "NSSM_EXE=D:\aj\Tools\nssm.exe"
if not exist "%NSSM_EXE%" (
    for /f "delims=" %%i in ('where nssm.exe 2^>nul') do set "NSSM_EXE=%%i"
)
if not exist "%NSSM_EXE%" (
    echo [ERROR] nssm.exe not found!
    echo Please ensure nssm.exe is placed in %APP_DIR%\tools\ or D:\aj\Tools\ or in PATH.
    pause
    exit /b 1
)

:: Detect Node
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
    for /f "delims=" %%i in ('where node.exe 2^>nul') do set "NODE_EXE=%%i"
)
if not exist "%NODE_EXE%" (
    echo [ERROR] node.exe not found! Please ensure Node.js is installed.
    pause
    exit /b 1
)

:: Detect Next.js start binary
set "NEXT_BIN=%APP_DIR%\node_modules\next\dist\bin\next"
if not exist "%NEXT_BIN%" (
    echo [ERROR] Next.js binary not found at %NEXT_BIN%!
    pause
    exit /b 1
)

:: Create logs directory
if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"

echo [1/3] Checking production build...
if not exist "%APP_DIR%\.next" (
    echo [.next folder missing - running build...]
    call npm run build
    if %errorLevel% neq 0 (
        echo [ERROR] Build failed! Aborting service installation.
        pause
        exit /b %errorLevel%
    )
) else (
    echo Production build found in .next directory.
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
"%NSSM_EXE%" set DakMonitoring Description "District DAK & Administrative Monitoring System Next.js Service"

echo.
echo [3/3] Starting DakMonitoring service...
"%NSSM_EXE%" start DakMonitoring

echo.
echo ====================================================
echo  Service 'DakMonitoring' successfully configured!
echo  Port: 3050
echo  URL:  http://10.70.233.176:3050 (or http://localhost:3050)
echo  Logs: %APP_DIR%\logs
echo ====================================================
echo.
pause
