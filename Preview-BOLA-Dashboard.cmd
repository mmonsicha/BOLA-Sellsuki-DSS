@echo off
setlocal

cd /d "%~dp0"

echo Starting BOLA dashboard preview...
call npm run dashboard:one-click
