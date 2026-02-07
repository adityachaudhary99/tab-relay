#!/bin/bash

# Publishing helper for Tab Relay

echo "Tab Relay - Publishing Helper"
echo "=============================="
echo ""

# Check icon exists
if [ ! -f "icons/icon-128.png" ]; then
    echo "Warning: icons/icon-128.png not found"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run tests
echo "Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "Tests failed!"
    exit 1
fi
echo "Tests passed"
echo ""

# Build
echo "Building extension..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi
echo "Build successful"
echo ""

# Package
echo "Packaging extension..."
npm run package
if [ $? -ne 0 ]; then
    echo "Packaging failed!"
    exit 1
fi

VERSION=$(node -p "require('./package.json').version")
echo ""
echo "Created: tab-relay.zip (v${VERSION})"
echo ""
echo "Next steps:"
echo ""
echo "  1. Test locally:"
echo "     - Open chrome://extensions"
echo "     - Enable Developer mode"
echo "     - Click 'Load unpacked' and select this directory"
echo ""
echo "  2. Publish to Chrome Web Store:"
echo "     - Go to https://chrome.google.com/webstore/devconsole"
echo "     - Click 'New item' (or update existing)"
echo "     - Upload tab-relay.zip"
echo "     - Fill in listing details and submit for review"
echo ""
echo "  3. Create a GitHub release:"
echo "     git tag -a v${VERSION} -m \"v${VERSION}\""
echo "     git push origin v${VERSION}"
echo "     # GitHub Actions will create the release automatically"
