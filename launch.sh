#!/bin/bash

# Configuration
PORT=${1:-8080}
DIRECTORY="learning-app"

# Find a suitable python command (prefer venv if present)
if [ -f "venv/bin/python3" ]; then
    PYTHON_CMD="venv/bin/python3"
elif [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
elif command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "Error: Python is required to run the local server but was not found." >&2
    exit 1
fi

# Function to automatically open the web app in the default browser
open_browser() {
    sleep 1 # Give the server a second to start up
    URL="http://localhost:$PORT/index.html"
    
    echo "Opening $URL in your browser..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$URL"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &>/dev/null; then
            xdg-open "$URL"
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        start "$URL"
    fi
}

# Run browser opening function in the background
open_browser &

echo "========================================================"
echo "   Designing Data-Intensive Applications Learning App"
echo "========================================================"
echo "Directory: $DIRECTORY"
echo "Port:      $PORT"
echo "Python:    $PYTHON_CMD"
echo ""
echo "👉 Open directly: http://localhost:$PORT/index.html"
echo "👉 Press Ctrl+C to shut down the server"
echo "========================================================"
echo ""

# Start the Flask app server
$PYTHON_CMD server.py "$PORT"
