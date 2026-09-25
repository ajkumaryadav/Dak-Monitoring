@echo off
setlocal
cd /d "%~dp0"

echo ====================================================
echo   DAK MONITORING SYSTEM - SERVER DIAGNOSTIC RUNNER
echo ====================================================
echo.

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
    for /f "delims=" %%i in ('where node.exe 2^>nul') do set "NODE_EXE=%%i"
)

if not exist "%NODE_EXE%" (
    echo [ERROR] node.exe not found!
    pause
    exit /b 1
)

"%NODE_EXE%" scripts\diagnose-dak-server.mjs

echo.
pause
