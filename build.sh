#!/bin/bash

# Build script for ChatGPT Custom Prompts Chrome Extension
# Creates a clean ZIP package ready for Chrome Web Store submission

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ChatGPT Custom Prompts - Build Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
echo -e "${GREEN}Version: ${VERSION}${NC}"
echo ""

# Define build directory and output file
BUILD_DIR="build"
OUTPUT_ZIP="chatgpt-custom-prompts-v${VERSION}.zip"

# Clean previous build
echo -e "${YELLOW}Cleaning previous build...${NC}"
rm -rf "$BUILD_DIR"
rm -f "$OUTPUT_ZIP"

# Create build directory
echo -e "${YELLOW}Creating build directory...${NC}"
mkdir -p "$BUILD_DIR"

# Copy required files
echo -e "${YELLOW}Copying extension files...${NC}"

# Core extension files
cp manifest.json "$BUILD_DIR/"
cp background.js "$BUILD_DIR/"
cp config.js "$BUILD_DIR/"
cp default-config.json "$BUILD_DIR/"
cp shortcuts.js "$BUILD_DIR/"

# Options page files
cp options.html "$BUILD_DIR/"
cp options.css "$BUILD_DIR/"
cp options.js "$BUILD_DIR/"

# Icons
mkdir -p "$BUILD_DIR/icons"
cp icons/*.png "$BUILD_DIR/icons/"

# License (required)
cp LICENSE "$BUILD_DIR/"

echo -e "${GREEN}✓ Copied all necessary files${NC}"
echo ""

# List what's included
echo -e "${BLUE}Files included in package:${NC}"
find "$BUILD_DIR" -type f | sed 's|build/||' | sort

echo ""
echo -e "${YELLOW}Creating ZIP archive...${NC}"

# Create ZIP (from within build directory to avoid nested paths)
cd "$BUILD_DIR"
zip -r "../$OUTPUT_ZIP" ./* -q
cd ..

# Get ZIP size
ZIP_SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)

echo -e "${GREEN}✓ Created $OUTPUT_ZIP ($ZIP_SIZE)${NC}"
echo ""

# Cleanup build directory
echo -e "${YELLOW}Cleaning up temporary build directory...${NC}"
rm -rf "$BUILD_DIR"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Package: ${NC}$OUTPUT_ZIP"
echo -e "${BLUE}Size: ${NC}$ZIP_SIZE"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the ZIP by loading it as an unpacked extension in Chrome"
echo "2. Go to chrome.google.com/webstore/devconsole"
echo "3. Upload $OUTPUT_ZIP"
echo "4. Complete the store listing with screenshots and description"
echo ""
echo -e "${GREEN}Files excluded from package:${NC}"
echo "  - .git/, .github/"
echo "  - docs/, images/"
echo "  - README.md, PRIVACY.md, PERMISSIONS_JUSTIFICATION.md"
echo "  - build.sh, .DS_Store"
echo "  - my-custom-prompt.txt"
echo "  - .claude/"
echo ""
