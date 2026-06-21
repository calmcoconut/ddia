#!/bin/bash

# Exit on error
set -e

# Directory configurations
VENV_DIR="venv"
PYTHON_BIN="$VENV_DIR/bin/python3"

# 1. Ensure virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment in '$VENV_DIR'..."
    python3 -m venv "$VENV_DIR"
fi

# 2. Upgrade pip and install/verify dependencies inside the venv
echo "Verifying dependencies inside virtual environment..."
"$PYTHON_BIN" -m pip install --upgrade -q pip
"$PYTHON_BIN" -m pip install -q google-generativeai openai anthropic flask pytest

# 3. Handle commands
COMMAND=${1:-"grade"}

case "$COMMAND" in
    "grade")
        echo "Running grade_responses.py inside the virtual environment..."
        shift # Remove "grade" from argument list
        # Execute the grading script using the venv Python
        "$PYTHON_BIN" grade_responses.py "$@"
        ;;
    "server")
        echo "Starting local learning platform server on port 8089..."
        echo "Navigate to: http://localhost:8089/index.html"
        # Run Flask server
        PORT=8089 "$PYTHON_BIN" server.py
        ;;
    "help"|"-h"|"--help")
        echo "Designing Data-Intensive Applications Learning App Runner"
        echo ""
        echo "Usage:"
        echo "  ./run.sh [command] [options]"
        echo ""
        echo "Commands:"
        echo "  grade [args]   Run AI grading script (default command). All additional args are forwarded."
        echo "                 e.g. ./run.sh grade --state customized_progress.json"
        echo "  server         Start the local web server on port 8080 (http://localhost:8080)"
        echo "  help           Show this help menu"
        echo ""
        ;;
    *)
        # If it's not a known command, pass everything directly to the grading script
        echo "Forwarding arguments to grade_responses.py..."
        "$PYTHON_BIN" grade_responses.py "$@"
        ;;
esac
