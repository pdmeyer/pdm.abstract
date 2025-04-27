#!/bin/bash

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq first."
    exit 1
fi

# Load configuration from package root
CONFIG_FILE="../dependencies.json"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: dependencies.json not found in package root"
    exit 1
fi

# Create directories
mkdir -p ../javascript/dependencies
mkdir -p ../abstractions/dependencies

# JavaScript Dependencies
echo "Bundling JavaScript dependencies..."
jq -r '.javascript[] | "cp \(.source) \(.destination)"' "$CONFIG_FILE" | while read -r cmd; do
    eval "$cmd"
done

# Max Patches
echo "Bundling Max patch dependencies..."
jq -r '.abstractions[] | "cp \(.source) \(.destination) 2>/dev/null || :"' "$CONFIG_FILE" | while read -r cmd; do
    eval "$cmd"
done

# Update imports in JavaScript files
echo "Updating imports..."
jq -r '.import_updates[] | "find ../javascript -name \"*.js\" -exec sed -i \"\" \"s|\(.search)|\(.replace)|g\" {} \\;"' "$CONFIG_FILE" | while read -r cmd; do
    eval "$cmd"
done

echo "Dependencies bundled successfully!" 