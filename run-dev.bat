@echo off
:: run-dev.bat
:: Kills any stale Node.js processes, then starts both PillMate projects
:: simultaneously in separate CMD windows.
::
:: Usage (from the aiascend root):
::   run-dev.bat
::
:: PillMate app   -> http://localhost:3001
:: Landing page   -> http://localhost:3000

echo.
echo  ================================================
echo    PillMate - Dev Launcher
echo  ================================================
echo    App (pillmate)    ^>  http://localhost:3001
echo    Landing page      ^>  http://localhost:3000
echo  ================================================
echo.

:: Kill any leftover node.exe processes (stale Next.js servers)
echo  Stopping existing Node processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

:: Remove Next.js lock files so next dev doesn't complain
if exist "%~dp0pillmate\.next\dev\lock" (
  del /f /q "%~dp0pillmate\.next\dev\lock" >nul 2>&1
)
if exist "%~dp0landing_page\.next\dev\lock" (
  del /f /q "%~dp0landing_page\.next\dev\lock" >nul 2>&1
)

echo  Starting servers...
echo.

:: Start PillMate app in a new window on port 3001
start "PillMate App :3001" cmd /k "cd /d %~dp0pillmate && npm run dev -- -p 3001"

:: Small delay so pillmate claims port 3001 first
timeout /t 2 /nobreak >nul

:: Start Landing page in a new window on port 3000
start "Landing Page :3000" cmd /k "cd /d %~dp0landing_page && npm run dev"

echo  Both servers are starting in separate windows.
echo.
