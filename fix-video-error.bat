@echo off
echo 🔧 Video Generation Error Fix
echo ============================
echo.

echo This script will help fix the "Unauthorized" video generation error.
echo.

echo Step 1: Checking backend server...
curl -s http://localhost:3001/health > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend server is not running!
    echo.
    echo To fix this:
    echo 1. Open a new terminal/command prompt
    echo 2. Run: cd backend
    echo 3. Run: npm run dev
    echo 4. Wait for "🚀 Video generation backend running on port 3001"
    echo 5. Then try generating video again
    echo.
    pause
    exit /b 1
)

echo ✅ Backend server is running
echo.

echo Step 2: Checking API key configuration...
curl -s http://localhost:3001/health | findstr "apiKeyConfigured.:false" > nul
if %errorlevel% equ 0 (
    echo ❌ FAL API key is not configured!
    echo.
    echo This is the cause of your "Unauthorized" error.
    echo.
    echo TO FIX THIS:
    echo ============
    echo 1. Get your API key from: https://fal.ai/
    echo 2. Sign up/login and create an API key
    echo 3. Copy the API key (it should look like: fal-xxxxxxxxxxxxxxxx)
    echo.
    
    set /p FAL_KEY=4. Paste your FAL API key here: 
    
    if "!FAL_KEY!"=="" (
        echo No API key entered. Please run this script again.
        pause
        exit /b 1
    )
    
    echo.
    echo 5. Setting your API key...
    set FAL_KEY=!FAL_KEY!
    
    echo ✅ API key has been set for this session!
    echo.
    echo 6. Now restart your backend server:
    echo    - Stop the backend (Ctrl+C in its terminal)
    echo    - Run: npm run dev
    echo    - Wait for it to show "✅ FAL API key configured"
    echo.
    echo 7. Then try generating video again!
    echo.
    
) else (
    echo ✅ API key appears to be configured
    echo.
    echo The error might be due to:
    echo - Invalid API key format
    echo - Network connectivity issues  
    echo - FAL service temporary issues
    echo.
    echo Try:
    echo 1. Check backend console logs for detailed errors
    echo 2. Verify your API key at https://fal.ai/
    echo 3. Restart the backend server
    echo.
)

echo Step 3: Testing configuration...
cd backend
node diagnose.js
cd ..

echo.
echo ===============================
echo 🎯 QUICK TROUBLESHOOTING GUIDE
echo ===============================
echo.
echo If video generation still fails:
echo.
echo 🔴 "Backend server not running":
echo    → cd backend && npm run dev
echo.
echo 🔴 "API key not configured":  
echo    → Get key from https://fal.ai/
echo    → set FAL_KEY=your_key_here
echo    → Restart backend
echo.
echo 🔴 "Unauthorized":
echo    → Check API key is valid
echo    → Ensure no extra spaces in key
echo    → Try regenerating key at fal.ai
echo.
echo 🔴 "Internal Server Error":
echo    → Check backend console for detailed logs
echo    → May be temporary FAL service issue
echo.

pause