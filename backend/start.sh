#!/bin/bash

echo "Starting Training Video Generation Backend..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if FAL_KEY is set
if [ -z "$FAL_KEY" ]; then
    echo "WARNING: FAL_KEY environment variable is not set"
    echo "You need to set your fal.ai API key:"
    echo "  export FAL_KEY=your_actual_api_key_here"
    echo ""
    echo "Or create a .env file with:"
    echo "  FAL_KEY=your_actual_api_key_here"
    echo ""
    echo "Press any key to continue anyway..."
    read -n 1 -s
fi

echo "Starting server..."
echo "Server will be available at: http://localhost:3001"
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev