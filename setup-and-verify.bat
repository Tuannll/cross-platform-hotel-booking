@echo off
setlocal
cd /d "%~dp0"
title NoWayHome - Setup and Verify

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-and-verify.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Qua trinh setup & verify gap loi!
    pause
    exit /b %errorlevel%
)

echo.
echo [OK] Hoan tat thanh cong!
pause
