@echo off
setlocal

net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

set "SERVICE_NAME=DAKMonitoring"
set "NSSM_EXE=%APP_DIR%\tools\nssm.exe"
if not exist "%NSSM_EXE%" (
    for /f "delims=" %%i in ('where nssm.exe 2^>nul') do set "NSSM_EXE=%%i"
)

echo ====================================================
echo  Uninstalling %SERVICE_NAME% Windows Service
echo ====================================================
"%NSSM_EXE%" stop %SERVICE_NAME%
"%NSSM_EXE%" remove %SERVICE_NAME% confirm
echo.
echo Service %SERVICE_NAME% removed.
pause
