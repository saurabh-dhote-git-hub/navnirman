@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Installing frontend dependencies...
  call npm ci
  if errorlevel 1 goto failed
)
echo Starting Navnirman customer web UI and admin dashboard...
call npm run dev -- --host 127.0.0.1
goto end
:failed
echo Dependency installation failed. Check Node.js and internet connection.
pause
:end
endlocal
