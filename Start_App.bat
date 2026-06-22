@echo off
title NFL-DE-Hub Dev Server
cd /d "%~dp0"

if not exist node_modules (
    echo [Setup] node_modules fehlt - installiere Abhaengigkeiten...
    call npm install
)

echo [Start] Dev-Server startet - Browser oeffnet sich in 8 Sekunden...
start "" cmd /c "timeout /t 8 >nul && start http://localhost:3000"
call npm run dev
pause
