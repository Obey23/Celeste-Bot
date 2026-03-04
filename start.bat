@echo off
setlocal enabledelayedexpansion

pm2 describe discord-bot >nul 2>&1
if errorlevel 1 (
    pm2 start index.js -i 1 --name discord-bot
) else (
    echo Bot already running.
)

:loop
timeout /t 1800 >nul

git fetch origin main >nul 2>&1
for /f %%i in ('git rev-parse HEAD') do set LOCAL=%%i
for /f %%i in ('git rev-parse origin/main') do set REMOTE=%%i

if not "!LOCAL!"=="!REMOTE!" (
    echo Update found on Github, downloading...
    git pull origin main
    
    echo Reloading bot...
    pm2 reload discord-bot
)

goto loop