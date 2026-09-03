@echo off
setlocal

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

echo ====================================================
echo  Restarting %SERVICE_NAME% Windows Service...
echo ====================================================

"%NSSM_EXE%" restart %SERVICE_NAME%
timeout /t 3 >nul

echo.
echo [Current Service Status]
"%NSSM_EXE%" status %SERVICE_NAME%

echo.
echo Check URL: http://localhost:3050 (or http://10.70.12.73:3050)
pause
