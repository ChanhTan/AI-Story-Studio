@echo off
title AI Story Video Creator
cd /d "%~dp0"

echo [1/2] Starting Backend...
start "Backend" cmd /k "cd /d backend && python main.py"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend...
start "Frontend" cmd /k "cd /d frontend && npm run dev"
timeout /t 5 /nobreak >nul

start http://localhost:3000
exit
