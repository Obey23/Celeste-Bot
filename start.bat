@echo off
setlocal enabledelayedexpansion

for /f %%i in ('pm2 id discord-bot 2^>nul') do set BOT_ID=%%i
if "!BOT_ID!"=="-1" (
    echo Bot not running. Starting...
    pm2 start index.js -i 1 --name discord-bot
) else (
    echo Bot already running, skipping startup.
)

:loop
timeout /t 900 >nul

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