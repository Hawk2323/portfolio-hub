@echo off
setlocal

cd /d "%~dp0"

echo.
echo Building Portfolio Hub static snapshot...
echo Project folder: %CD%
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js, then run this script again.
  call :pause_if_needed
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies with npm ci...
  call npm ci
  if errorlevel 1 goto failed
  echo.
)

call npm run snapshot
if errorlevel 1 goto failed

echo.
echo Snapshot is ready:
echo %CD%\portfolio-hub-snapshot.zip
echo.
echo Upload this ZIP to the CDN, or use the GitHub release download.
call :pause_if_needed
exit /b 0

:failed
echo.
echo Snapshot build failed.
echo If npm run dev is running, stop it with Ctrl+C and run this script again.
call :pause_if_needed
exit /b 1

:pause_if_needed
if not "%SKIP_PAUSE%"=="1" pause
exit /b 0
