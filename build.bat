@echo off
echo Building BlinkBudget for production...
echo.

cd /d "%~dp0"
echo 1. Validating environment...
node config/validate-env.cjs
if %errorlevel% neq 0 (
    echo Environment validation failed!
    exit /b 1
)

echo 2. Building production bundle...
.\node_modules\.bin\vite.cmd build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)

echo.
echo Build completed successfully! ✅
echo Output directory: dist/
exit /b 0
