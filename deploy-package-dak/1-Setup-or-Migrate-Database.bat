@echo off
setlocal EnableDelayedExpansion

:: 1. Auto-Elevate to Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ====================================================
    echo  Requesting Administrator Privileges...
    echo ====================================================
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

echo ====================================================
echo  Dak-Monitoring: Setup & Migrate Database
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

echo Running database migrations script...
"%NODE_EXE%" scripts\apply-all-migrations.mjs
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Database setup encountered errors. Please check your .env.production or .env.local file.
    pause
    exit /b %errorLevel%
)

echo.
echo Running verification...
"%NODE_EXE%" scripts\verify-database.mjs

echo.
pause
