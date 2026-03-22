#!/bin/bash

echo "🛑 Stopping Training Database..."
echo ""

# Stop the database services
docker-compose down

if [ $? -eq 0 ]; then
    echo "✅ Database stopped successfully!"
else
    echo "❌ Failed to stop database"
    echo "You may need to stop containers manually:"
    echo "   docker stop training_db training_adminer"
fi