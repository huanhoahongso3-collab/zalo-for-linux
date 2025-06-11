#!/bin/bash

# Test script for Zalo for Linux local development
# Author: doandat943

set -e

echo "🚀 Zalo for Linux - Local Test Script"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📋 Node.js version: $(node --version)"
echo "📋 npm version: $(npm --version)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if app directory exists
if [ ! -d "app" ]; then
    echo "⚠️  App directory not found. You need to extract Zalo first."
    echo ""
    echo "💡 To extract Zalo, run:"
    echo "   DMG_URL=\"https://res-download-pc-te-vnso-pt-51.zadn.vn/mac/ZaloSetup-universal-25.5.3.dmg\" npm run extract-dmg"
    echo ""
    read -p "❓ Do you want to extract now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Starting extraction..."
        DMG_URL="https://res-download-pc-te-vnso-pt-51.zadn.vn/mac/ZaloSetup-universal-25.5.3.dmg" npm run extract-dmg
    else
        echo "⏭️  Skipping extraction."
        exit 0
    fi
else
    echo "✅ App directory found"
    if [ -f "app/package.json" ]; then
        APP_NAME=$(node -p "require('./app/package.json').name" 2>/dev/null || echo "Unknown")
        APP_VERSION=$(node -p "require('./app/package.json').version" 2>/dev/null || echo "Unknown")
        echo "📱 App: $APP_NAME v$APP_VERSION"
    fi
fi

echo ""
echo "🛠️  Available commands:"
echo "   npm start          - Run Zalo in development mode"
echo "   npm run build      - Build AppImage"
echo "   npm run build:linux - Build Linux AppImage only"
echo ""

read -p "❓ What would you like to do? [start/build/quit]: " action

case $action in
    start|s)
        echo "🚀 Starting Zalo in development mode..."
        npm start
        ;;
    build|b)
        echo "🔨 Building AppImage..."
        npm run build:linux
        
        # Check if build was successful
        if [ -d "dist" ]; then
            echo "✅ Build completed!"
            echo "📦 Build outputs:"
            ls -la dist/ | grep -E "\.(AppImage|deb|rpm)$" || echo "   No packages found in dist/"
            
            # Find AppImage file
            APPIMAGE_FILE=$(find dist -name "*.AppImage" -type f | head -1)
            if [ -n "$APPIMAGE_FILE" ]; then
                echo ""
                echo "🎉 AppImage created: $APPIMAGE_FILE"
                echo "📏 Size: $(stat -c%s "$APPIMAGE_FILE" | numfmt --to=iec)"
                echo ""
                echo "💡 To run the AppImage:"
                echo "   chmod +x \"$APPIMAGE_FILE\""
                echo "   \"$APPIMAGE_FILE\""
            fi
        else
            echo "❌ Build failed - no dist directory found"
        fi
        ;;
    quit|q|"")
        echo "👋 Goodbye!"
        ;;
    *)
        echo "❌ Invalid option: $action"
        echo "   Valid options: start, build, quit"
        ;;
esac 