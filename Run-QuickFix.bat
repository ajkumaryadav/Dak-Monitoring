@echo off
setlocal
cd /d "%~dp0"

echo ====================================================
echo   DAK MONITORING SYSTEM - ONE-GO DATABASE REPAIR
echo ====================================================
echo.

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
    for /f "delims=" %%i in ('where node.exe 2^>nul') do set "NODE_EXE=%%i"
)

if not exist "%NODE_EXE%" (
    echo [ERROR] node.exe not found! Please ensure Node.js is installed.
    pause
    exit /b 1
)

"%NODE_EXE%" quick-fix-database.mjs

echo.
pause
