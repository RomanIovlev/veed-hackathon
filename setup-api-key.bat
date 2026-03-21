@echo off
echo ===================================================
echo          🔑 FAL API KEY SETUP GUIDE
echo ===================================================
echo.

echo Step 1: Get your API key
echo ========================
echo 1. Go to: https://fal.ai/
echo 2. Sign up or log in
echo 3. Navigate to your API keys section
echo 4. Create a new API key or copy existing one
echo.

echo Step 2: Set your API key
echo ========================
echo Please enter your FAL API key when prompted:
echo (Note: It should start with something like 'fal-' or similar)
echo.

set /p FAL_KEY=Enter your FAL API key: 

if "%FAL_KEY%"=="" (
    echo.
    echo ❌ No API key entered. Exiting...
    pause
    exit /b 1
)

echo.
echo Setting environment variable...
set FAL_KEY=%FAL_KEY%

echo.
echo Step 3: Test the configuration
echo ==============================

REM Check if backend is running
echo Testing backend connection...
curl -s http://localhost:3001/health > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend is not running. Please start it:
    echo    cd backend
    echo    npm run dev
    echo.
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Backend is running

REM Test the API key
echo Testing API key...
echo.
curl -X POST http://localhost:3001/generate-video ^
     -H "Content-Type: application/json" ^
     -d "{\"script\":\"Test script\",\"imageUrl\":\"https://picsum.photos/400/300\",\"resolution\":\"720p\"}" 2>&1 | findstr "API key not configured" > nul

if %errorlevel% equ 0 (
    echo ❌ API key still not configured properly
    echo Please check that you entered the correct key
) else (
    echo ✅ API key appears to be configured
)

echo.
echo ===================================================
echo                 SETUP COMPLETE
echo ===================================================
echo.
echo Your FAL_KEY has been set for this session.
echo.
echo 🚀 Next steps:
echo 1. Your API key is now active
echo 2. Open your training app: http://localhost:5173
echo 3. Try generating a video in the Create Training flow
echo.
echo 💡 Note: This API key will only work for this command prompt session.
echo    To make it permanent, add it to your system environment variables.
echo.
pause