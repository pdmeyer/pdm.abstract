#!/bin/bash

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Warning: GitHub CLI (gh) is not installed. You'll need to create the GitHub release manually."
    echo "Install it with: brew install gh"
fi

# Get current version from package-info.json
CURRENT_VERSION=$(jq -r '.version' ../package-info.json)
if [ -z "$CURRENT_VERSION" ]; then
    echo "Error: Could not determine current version from package-info.json"
    exit 1
fi

# Prompt for new version
echo "Current version: $CURRENT_VERSION"
read -p "Enter new version number (or press Enter to keep current): " NEW_VERSION
NEW_VERSION=${NEW_VERSION:-$CURRENT_VERSION}

if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
    # Update version in package-info.json
    echo "Updating version to $NEW_VERSION..."
    jq --arg v "$NEW_VERSION" '.version = $v' ../package-info.json > ../package-info.json.tmp
    mv ../package-info.json.tmp ../package-info.json
    
    # Commit version update
    git add ../package-info.json
    git commit -m "Bump version to $NEW_VERSION"
fi

# Get package name from package-info.json
PACKAGE_NAME=$(jq -r '.name' ../package-info.json)
if [ -z "$PACKAGE_NAME" ]; then
    echo "Error: Could not determine package name from package-info.json"
    exit 1
fi

# Create release directory
RELEASE_DIR="${PACKAGE_NAME}-${NEW_VERSION}"
mkdir -p "$RELEASE_DIR"

# Bundle dependencies
echo "Bundling dependencies..."
./bundle-dependencies.sh

# Copy files to release directory
echo "Creating release package..."
cp -R ../javascript "$RELEASE_DIR/"
cp -R ../abstractions "$RELEASE_DIR/"
cp -R ../patchers "$RELEASE_DIR/"
cp -R ../help "$RELEASE_DIR/"
cp ../package-info.json "$RELEASE_DIR/"
cp ../LICENSE "$RELEASE_DIR/"

# Create zip file
echo "Creating zip file..."
ZIP_FILE="${PACKAGE_NAME}-${NEW_VERSION}.zip"
zip -r "$ZIP_FILE" "$RELEASE_DIR"

# Clean up
echo "Cleaning up..."
rm -rf "$RELEASE_DIR"

echo "Release created: $ZIP_FILE"

# Create git tag
echo "Creating git tag..."
git tag -a "v${NEW_VERSION}" -m "Release version ${NEW_VERSION}"

# Push changes
echo "Pushing changes to GitHub..."
git push origin main
git push origin "v${NEW_VERSION}"

# Create GitHub release if gh is installed
if command -v gh &> /dev/null; then
    echo "Creating GitHub release..."
    read -p "Enter release title (or press Enter for default): " RELEASE_TITLE
    RELEASE_TITLE=${RELEASE_TITLE:-"Release v${NEW_VERSION}"}
    
    read -p "Enter release notes (or press Enter for default): " RELEASE_NOTES
    RELEASE_NOTES=${RELEASE_NOTES:-"Release v${NEW_VERSION}"}
    
    gh release create "v${NEW_VERSION}" \
        --title "$RELEASE_TITLE" \
        --notes "$RELEASE_NOTES" \
        "$ZIP_FILE"
else
    echo "GitHub CLI not found. Please create the release manually:"
    echo "1. Go to https://github.com/yourusername/${PACKAGE_NAME}/releases/new"
    echo "2. Select tag v${NEW_VERSION}"
    echo "3. Upload $ZIP_FILE"
    echo "4. Add release notes"
    echo "5. Click 'Publish release'"
fi

echo "Release process completed!" 