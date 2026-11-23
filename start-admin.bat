@echo off
setlocal
cd /d "%~dp0"
echo Installing dependencies...
call npm ci
if errorlevel 1 exit /b 1
echo Starting Navnirman Admin Dashboard...
echo Open http://localhost:5173/admin in your browser.
call npm run dev -- --host 127.0.0.1
endlocal
