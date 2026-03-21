@echo off
echo.
echo ==============================================
echo   🔑 FAL API KEY SETUP - VIDEO GENERATION
echo ==============================================
echo.
echo Your backend is running but missing the FAL API key.
echo This is causing the "Unauthorized" error.
echo.

echo Step 1: Get your API key
echo ========================
echo 1. Open: https://fal.ai/
echo 2. Sign up/login and create an API key
echo 3. Copy the API key (looks like: fal-xxxxxxxxx)
echo.

set /p FAL_KEY="Step 2: Paste your FAL API key here: "

if "%FAL_KEY%"=="" (
    echo.
    echo ❌ No API key entered. Please try again.
    pause
    exit /b 1
)

echo.
echo Step 3: Setting up your API key...
set FAL_KEY=%FAL_KEY%

echo ✅ FAL_KEY environment variable has been set!
echo.
echo Step 4: Restart your backend server
echo ===================================
echo 1. Go to the terminal running your backend
echo 2. Press Ctrl+C to stop it
echo 3. Run: npm run dev
echo 4. Look for: "✅ FAL API key configured"
echo.
echo Step 5: Test video generation
echo =============================
echo 1. Go to your training app: http://localhost:8081
echo 2. Create a training with script
echo 3. Click "Generate Video" button
echo 4. Should work now! 🎬
echo.

echo 💡 Note: This API key is only set for this command session.
echo    To make it permanent, add it to your system environment variables.
echo.

pause