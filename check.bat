@echo off
echo Running BlinkQuality checks...
echo.

echo 1. Running ESLint...
cd /d "%~dp0"
echo Current directory: %CD%
echo Running ESLint command...
call .\node_modules\.bin\eslint.cmd . --max-warnings 0
set ESLINT_RESULT=%errorlevel%
echo ESLint result code: %ESLINT_RESULT%
if %ESLINT_RESULT% neq 0 (
    echo ESLint failed with error code %ESLINT_RESULT%!
    exit /b 1
)
echo ESLint passed!

echo 2. Running Stylelint...
cd /d "%~dp0"
echo Running Stylelint command...
call .\node_modules\.bin\stylelint.cmd "src/styles/**/*.css"
set STYLELINT_RESULT=%errorlevel%
echo Stylelint result code: %STYLELINT_RESULT%
if %STYLELINT_RESULT% neq 0 (
    echo Stylelint failed with error code %STYLELINT_RESULT%!
    exit /b 1
)
echo Stylelint passed!

echo 3. Running Prettier check...
cd /d "%~dp0"
echo Running Prettier command...
call .\node_modules\.bin\prettier.cmd --write .
set PRETTIER_RESULT=%errorlevel%
echo Prettier result code: %PRETTIER_RESULT%
if %PRETTIER_RESULT% neq 0 (
    echo Prettier check failed with error code %PRETTIER_RESULT%!
    exit /b 1
)
echo Prettier passed!

echo.
echo All checks passed!
exit /b 0
