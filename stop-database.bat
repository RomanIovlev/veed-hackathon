@echo off
echo Stopping Local Training Database...
echo.

REM Stop the Docker containers
docker-compose down

echo.
echo Database stopped successfully!
echo To start the database again, run: start-database.bat
echo.
pause