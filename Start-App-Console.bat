@echo off
setlocal

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
    for /f "delims=" %%i in ('where node.exe 2^>nul') do set "NODE_EXE=%%i"
)

if not exist "%NODE_EXE%" (
    echo [ERROR] node.exe not found! Please install Node.js.
    pause
    exit /b 1
)

echo ====================================================
echo  Starting DAK Monitoring System (Console Mode)
echo  Port: 8080 (0.0.0.0)
echo  Press Ctrl+C to stop
echo ====================================================
echo.

set "PORT=8080"
set "HOSTNAME=0.0.0.0"
set "NODE_ENV=production"

"%NODE_EXE%" server.js
pause
