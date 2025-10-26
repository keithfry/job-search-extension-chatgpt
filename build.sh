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

# Define build directories and output file
BUILD_TEMP="build-temp"
BUILD_DIR="build"
OUTPUT_ZIP="chatgpt-custom-prompts-v${VERSION}.zip"

# Clean previous build
echo -e "${YELLOW}Cleaning previous build...${NC}"
rm -rf "$BUILD_TEMP"

# Create build directories
echo -e "${YELLOW}Creating build directory...${NC}"
mkdir -p "$BUILD_DIR"
mkdir -p "$BUILD_TEMP"

# Copy required files
echo -e "${YELLOW}Copying extension files...${NC}"

# Core extension files
cp manifest.json "$BUILD_TEMP/"
cp background.js "$BUILD_TEMP/"
cp config.js "$BUILD_TEMP/"
cp default-config.json "$BUILD_TEMP/"
cp shortcuts.js "$BUILD_TEMP/"

# Options page files
cp options.html "$BUILD_TEMP/"
cp options.css "$BUILD_TEMP/"
cp options.js "$BUILD_TEMP/"

# Icons
mkdir -p "$BUILD_TEMP/icons"
cp icons/*.png "$BUILD_TEMP/icons/"

# License (required)
cp LICENSE "$BUILD_TEMP/"

echo -e "${GREEN}✓ Copied all necessary files${NC}"
echo ""

# List what's included
echo -e "${BLUE}Files included in package:${NC}"
find "$BUILD_TEMP" -type f | sed 's|build-temp/||' | sort

echo ""
echo -e "${YELLOW}Creating ZIP archive...${NC}"

# Create ZIP (from within build-temp directory to avoid nested paths)
cd "$BUILD_TEMP"
zip -r "../$BUILD_DIR/$OUTPUT_ZIP" ./* -q
cd ..

# Get ZIP size
ZIP_SIZE=$(du -h "$BUILD_DIR/$OUTPUT_ZIP" | cut -f1)

echo -e "${GREEN}✓ Created $BUILD_DIR/$OUTPUT_ZIP ($ZIP_SIZE)${NC}"
echo ""

# Cleanup temporary build directory
echo -e "${YELLOW}Cleaning up temporary build directory...${NC}"
rm -rf "$BUILD_TEMP"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Package: ${NC}$BUILD_DIR/$OUTPUT_ZIP"
echo -e "${BLUE}Size: ${NC}$ZIP_SIZE"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the ZIP by loading it as an unpacked extension in Chrome"
echo "2. Go to chrome.google.com/webstore/devconsole"
echo "3. Upload $BUILD_DIR/$OUTPUT_ZIP"
echo "4. Complete the store listing with screenshots and description"
echo ""
echo -e "${GREEN}Files excluded from package:${NC}"
echo "  - .git/, .github/"
echo "  - docs/, images/"
echo "  - README.md, PRIVACY.md, PERMISSIONS_JUSTIFICATION.md"
echo "  - build.sh, .DS_Store"
echo "  - .claude/"
echo ""
