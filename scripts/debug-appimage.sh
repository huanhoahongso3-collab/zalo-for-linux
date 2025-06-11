#!/bin/bash

# Debug script for Zalo AppImage
# Author: doandat943

set -e

echo "🔍 Zalo AppImage Debug Script"
echo "============================"

APPIMAGE_FILE="dist/Zalo-25.5.3.AppImage"

if [ ! -f "$APPIMAGE_FILE" ]; then
    echo "❌ AppImage not found: $APPIMAGE_FILE"
    echo "💡 Run 'npm run build:linux' first"
    exit 1
fi

echo "📁 AppImage file: $APPIMAGE_FILE"
echo "📏 Size: $(stat -c%s "$APPIMAGE_FILE" | numfmt --to=iec)"
echo ""

echo "🛠️  Available debug options:"
echo "1) Extract AppImage contents for inspection"
echo "2) Run AppImage with verbose output"
echo "3) Run AppImage with trace warnings"
echo "4) Test AppImage in dry-run mode"
echo "5) Show AppImage metadata"
echo ""

read -p "❓ Choose option [1-5]: " option

case $option in
    1)
        echo "📂 Extracting AppImage contents..."
        if [ -d "debug-extracted" ]; then
            rm -rf debug-extracted
        fi
        
        cd debug-extracted || mkdir debug-extracted && cd debug-extracted
        "../$APPIMAGE_FILE" --appimage-extract > /dev/null
        
        echo "✅ Extracted to: debug-extracted/squashfs-root/"
        echo "📋 Structure:"
        ls -la squashfs-root/ | head -20
        
        echo ""
        echo "🔍 Key files:"
        echo "- Main executable: squashfs-root/AppRun"
        echo "- Electron app: squashfs-root/resources/app.asar"
        echo "- Zalo files: squashfs-root/app/"
        
        if [ -f "squashfs-root/app/bootstrap.js" ]; then
            echo "✅ Zalo bootstrap.js found"
        else
            echo "❌ Zalo bootstrap.js missing"
        fi
        
        cd ..
        ;;
        
    2)
        echo "🚀 Running AppImage with verbose output..."
        echo "💡 Press Ctrl+C to stop"
        echo ""
        ELECTRON_ENABLE_LOGGING=1 "$APPIMAGE_FILE" --verbose
        ;;
        
    3)
        echo "🚀 Running AppImage with trace warnings..."
        echo "💡 Press Ctrl+C to stop"
        echo ""
        "$APPIMAGE_FILE" --trace-warnings
        ;;
        
    4)
        echo "🧪 Testing AppImage structure (dry-run)..."
        # Test if AppImage can be mounted
        if "$APPIMAGE_FILE" --appimage-offset > /dev/null 2>&1; then
            echo "✅ AppImage structure is valid"
            
            # Check if app files are accessible
            TEMP_MOUNT=$(mktemp -d)
            "$APPIMAGE_FILE" --appimage-mount "$TEMP_MOUNT" &
            MOUNT_PID=$!
            
            sleep 2
            
            if [ -f "$TEMP_MOUNT/app/bootstrap.js" ]; then
                echo "✅ Zalo app files accessible"
            else
                echo "❌ Zalo app files not accessible"
                echo "🔍 Available files in app/:"
                ls -la "$TEMP_MOUNT/app/" | head -10
            fi
            
            # Cleanup
            kill $MOUNT_PID 2>/dev/null || true
            rmdir "$TEMP_MOUNT" 2>/dev/null || true
        else
            echo "❌ AppImage structure is invalid"
        fi
        ;;
        
    5)
        echo "📋 AppImage metadata:"
        echo ""
        echo "🏷️  File info:"
        file "$APPIMAGE_FILE"
        echo ""
        
        echo "📦 AppImage details:"
        "$APPIMAGE_FILE" --appimage-help 2>/dev/null || echo "No AppImage help available"
        
        if command -v strings > /dev/null; then
            echo ""
            echo "🔍 Embedded strings (first 20):"
            strings "$APPIMAGE_FILE" | grep -E "(Zalo|Electron|electron)" | head -20
        fi
        ;;
        
    *)
        echo "❌ Invalid option: $option"
        echo "   Valid options: 1, 2, 3, 4, 5"
        exit 1
        ;;
esac

echo ""
echo "🎉 Debug completed!" 