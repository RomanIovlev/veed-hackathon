@echo off
echo Starting Training Video Generation Backend...
echo.

REM Check if Node.js is installed
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if FAL_KEY is set
if "%FAL_KEY%"=="" (
    echo WARNING: FAL_KEY environment variable is not set
    echo You need to set your fal.ai API key:
    echo   set FAL_KEY=your_actual_api_key_here
    echo.
    echo Or create a .env file with:
    echo   FAL_KEY=your_actual_api_key_here
    echo.
    echo Press any key to continue anyway...
    pause > nul
)

echo Starting server...
echo Server will be available at: http://localhost:3001
echo Press Ctrl+C to stop the server
echo.

npm run dev