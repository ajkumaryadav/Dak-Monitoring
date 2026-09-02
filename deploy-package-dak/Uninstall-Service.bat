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

set "NSSM_EXE=%APP_DIR%\tools\nssm.exe"
if not exist "%NSSM_EXE%" set "NSSM_EXE=D:\aj\Tools\nssm.exe"
if not exist "%NSSM_EXE%" (
    for /f "delims=" %%i in ('where nssm.exe 2^>nul') do set "NSSM_EXE=%%i"
)

echo ====================================================
echo  Stopping and removing DakMonitoring service...
echo ====================================================
"%NSSM_EXE%" stop DakMonitoring
"%NSSM_EXE%" remove DakMonitoring confirm

echo.
echo DakMonitoring service removed successfully.
pause
