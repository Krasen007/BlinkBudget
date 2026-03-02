@echo off
echo Installing BlinkBudget dependencies...
echo.

cd /d "%~dp0"
echo 2. Installing dependencies (without scripts to avoid conflicts)...
npm install --ignore-scripts
if %errorlevel% neq 0 (
    echo Installation failed!
    exit /b 1
)

echo.
echo Dependencies installed successfully! ✅
echo Note: Use check.bat to verify code quality
echo Note: Use dev.bat to start development server
exit /b 0
