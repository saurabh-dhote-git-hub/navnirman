@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Installing frontend dependencies...
  call npm ci
  if errorlevel 1 goto failed
)
echo Building customer UI...
call npm run build
if errorlevel 1 goto failed
echo Syncing Capacitor Android project...
call npx cap sync android
if errorlevel 1 goto failed
echo Done. Open the android folder in Android Studio.
pause
goto end
:failed
echo Build or Android sync failed. Read the error above.
pause
:end
endlocal
