@echo off
setlocal
cd /d "%~dp0\backend"
if "%ADMIN_EMAIL%"=="" set /p ADMIN_EMAIL=Admin email:
if "%ADMIN_PASSWORD%"=="" set /p ADMIN_PASSWORD=Admin password (12+ characters):
if "%ADMIN_NAME%"=="" set ADMIN_NAME=Navnirman Admin
if "%ADMIN_EMAIL%"=="" goto missing
if "%ADMIN_PASSWORD%"=="" goto missing
echo Starting Navnirman backend on port 8080...
echo Ensure your MySQL database is running on localhost:3307.
mvn spring-boot:run
goto end
:missing
echo Admin email and password are required for initial admin creation.
pause
:end
endlocal
