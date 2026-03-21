@echo off
echo Starting Local Training Database...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed.
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Docker is running, starting database...
docker-compose up -d

echo.
echo Database is starting up...
echo - PostgreSQL will be available at localhost:5432
echo - Database: training_db
echo - Username: training_user
echo - Password: training_pass
echo.
echo Web Admin Interface (Adminer):
echo - URL: http://localhost:8080
echo - System: PostgreSQL
echo - Server: postgres (or localhost from outside Docker)
echo - Database: training_db
echo - Username: training_user
echo - Password: training_pass
echo.

REM Wait for database to be ready
echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Database should now be ready! 
echo To stop the database, run: stop-database.bat
echo.
pause