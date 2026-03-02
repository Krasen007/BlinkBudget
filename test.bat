@echo off
echo Running BlinkBudget tests...
echo.

cd /d "%~dp0"
.\node_modules\.bin\vitest.cmd
if %errorlevel% neq 0 (
    echo Tests failed!
    exit /b 1
)

echo.
echo All tests passed! ✅
exit /b 0
