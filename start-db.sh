#!/bin/bash

echo "🚀 Starting Training Database..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null; then
    echo "❌ ERROR: docker-compose is not installed"
    echo "Please install Docker Desktop which includes docker-compose"
    exit 1
fi

echo "🐳 Starting PostgreSQL database and Adminer..."

# Start the database services
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database started successfully!"
    echo ""
    echo "📊 Database Connection Details:"
    echo "   Host: localhost"
    echo "   Port: 5433"
    echo "   Database: training_db"
    echo "   Username: training_user"
    echo "   Password: training_pass"
    echo ""
    echo "🔧 Adminer (DB Management): http://localhost:8085"
    echo ""
    echo "💡 Useful commands:"
    echo "   Stop database: docker-compose down"
    echo "   View logs: docker-compose logs postgres"
    echo "   Restart: docker-compose restart postgres"
    echo ""
else
    echo ""
    echo "❌ Failed to start database"
    echo "Check the Docker logs for more information:"
    echo "   docker-compose logs"
    exit 1
fi