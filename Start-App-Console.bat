@echo off
setlocal EnableDelayedExpansion

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

echo ====================================================
echo  Starting Dak-Monitoring in Interactive Console Mode
echo  Directory: %APP_DIR%
echo  URL:       http://localhost:3050 (or http://10.70.12.73:3050)
echo ====================================================
echo.

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
    pause
    exit /b 1
)

set PORT=3050
set HOSTNAME=0.0.0.0
set NODE_ENV=production

"%NODE_EXE%" "%NEXT_BIN%" start --port 3050 --hostname 0.0.0.0

pause
