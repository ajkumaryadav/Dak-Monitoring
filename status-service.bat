@echo off
setlocal

set "NSSM_EXE=D:\aj\Tools\nssm.exe"
if not exist "%NSSM_EXE%" (
    for /f "delims=" %%i in ('where nssm.exe 2^>nul') do set "NSSM_EXE=%%i"
)

echo ====================================================
echo  DakMonitoring Service Status
echo ====================================================
"%NSSM_EXE%" status DakMonitoring

echo.
echo Checking port 3050 listener:
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3050 -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, State, OwningProcess | Format-Table -AutoSize"

echo.
echo Testing HTTP response on http://localhost:3050 :
powershell -NoProfile -Command "try { $res = Invoke-WebRequest -Uri 'http://localhost:3050' -UseBasicParsing -TimeoutSec 5; Write-Host ('Status Code: ' + $res.StatusCode) -ForegroundColor Green } catch { Write-Host ('Error: ' + $_.Exception.Message) -ForegroundColor Red }"

echo.
pause
