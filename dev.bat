@echo off
echo Starting BlinkBudget development server...
echo.

cd /d "%~dp0"
.\node_modules\.bin\vite.cmd
if %errorlevel% neq 0 (
    echo Failed to start development server!
    exit /b 1
)

exit /b 0
