@echo off
title Anime Gesture Attacks
cd /d "%~dp0"
echo ========================================================
echo   Launching Anime Gesture Attacks Web App...
echo ========================================================

"C:\Users\PC\AppData\Local\Programs\Python\Python312\python.exe" server.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying fallback python...
    python server.py
)

pause
