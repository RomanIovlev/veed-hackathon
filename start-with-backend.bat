@echo off
echo Starting Training Hackathon with Video Generation Backend...
echo.

REM Check if backend dependencies exist
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

echo.
echo ============================================================
echo   IMPORTANT: Set your FAL API key before generating videos
echo   set FAL_KEY=424ab32d-da50-4435-b48f-14fa5ad231d4:efc4941c1753d96b96d78c6c1ad44fb3
echo ============================================================
echo.

REM Start backend in background
echo Starting video generation backend...
start "Video Backend" cmd /k "cd backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
echo Starting frontend...
npm run dev

echo.
echo Both servers should now be running:
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:3001
echo.
pause