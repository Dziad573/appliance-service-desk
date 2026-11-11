@echo off
title Appliance Service Desk - Local Development
cd /d %~dp0

echo ==========================================
echo    APPLIANCE SERVICE DESK - LOCAL DEV
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo BLAD: Nie znaleziono Node.js. Zainstaluj Node.js LTS.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo BLAD: Nie znaleziono npm.
  pause
  exit /b 1
)

echo [1/4] Instalowanie / uzupelnianie zaleznosci backendu...
cd /d %~dp0backend
call npm install
if errorlevel 1 (
  echo BLAD: Nie udalo sie zainstalowac zaleznosci backendu.
  pause
  exit /b 1
)

echo [2/4] Instalowanie / uzupelnianie zaleznosci frontendu...
cd /d %~dp0frontend
call npm install
if errorlevel 1 (
  echo BLAD: Nie udalo sie zainstalowac zaleznosci frontendu.
  pause
  exit /b 1
)

echo [3/4] Uruchamianie backendu (SQLite)...
start "Appliance Service Desk - Backend" cmd /k "cd /d %~dp0backend && npm run start:local"

timeout /t 3 /nobreak >nul

echo [4/4] Uruchamianie frontendu...
start "Appliance Service Desk - Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
pause
