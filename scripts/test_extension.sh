#!/bin/bash

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install web-ext globally if not already installed
if ! command -v web-ext &> /dev/null
then
    echo "Installing web-ext..."
    npm install -g web-ext
fi

# Run web-ext in the current directory
echo "Running web-ext..."
web-ext run

echo "Done! The extension should now be running in a new Firefox instance."
