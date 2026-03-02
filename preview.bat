@echo off
echo Previewing BlinkBudget production build...
echo.

cd /d "%~dp0"
.\node_modules\.bin\vite.cmd preview
if %errorlevel% neq 0 (
    echo Failed to start preview server!
    exit /b 1
)

exit /b 0
