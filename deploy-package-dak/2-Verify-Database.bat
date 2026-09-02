@echo off
setlocal EnableDelayedExpansion

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

echo ====================================================
echo  Dak-Monitoring: Verify Database Integrity
echo  Directory: %APP_DIR%
echo ====================================================
echo.

:: Detect Node
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" (
    for /f "delims=" %%i in ('where node.exe 2^>nul') do set "NODE_EXE=%%i"
)
if not exist "%NODE_EXE%" (
    echo [ERROR] node.exe not found in PATH or standard directory!
    pause
    exit /b 1
)

"%NODE_EXE%" scripts\verify-database.mjs

echo.
pause
