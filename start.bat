
@echo off
title Appliance Service Desk - Launcher

echo ==========================================
echo       APPLIANCE SERVICE DESK
echo ==========================================
echo.

:: Sprawdzenie Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo BLAD: Nie znaleziono Node.js.
    echo Zainstaluj Node.js i uruchom ponownie skrypt.
    pause
    exit /b 1
)

:: Sprawdzenie npm
where npm >nul 2>&1
if errorlevel 1 (
    echo BLAD: Nie znaleziono npm.
    pause
    exit /b 1
)

echo [1/4] Sprawdzanie zaleznosci backendu...

if not exist "backend\node_modules" (
    echo Instalowanie zaleznosci backendu...
    cd backend
    call npm install
    cd ..
)

echo [2/4] Sprawdzanie zaleznosci frontendu...

if not exist "frontend\node_modules" (
    echo Instalowanie zaleznosci frontendu...
    cd frontend
    call npm install
    cd ..
)

echo [3/4] Uruchamianie backendu...

start "Appliance Service Desk - Backend" cmd /k "cd /d %~dp0backend && node index.js"

timeout /t 3 /nobreak >nul

echo [4/4] Uruchamianie frontendu...

start "Appliance Service Desk - Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ==========================================
echo Projekt zostal uruchomiony.
echo.
echo FRONTEND: http://localhost:3000
echo BACKEND:  http://localhost:3001
echo ==========================================
echo.

pause
