@echo off
setlocal EnableDelayedExpansion

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

echo ====================================================
echo  Creating Offline Deployment Package for 10.70.233.176
echo ====================================================

node scripts\create-deploy-package.mjs

pause
