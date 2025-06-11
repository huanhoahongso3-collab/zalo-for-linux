#!/bin/bash

echo "🔍 Zalo Window Checker"
echo "====================="

echo "📊 Electron processes:"
ps aux | grep electron | grep -v grep | wc -l

echo ""
echo "🪟 Checking for windows..."

# Try to get window list
if command -v wmctrl &> /dev/null; then
    echo "Using wmctrl:"
    wmctrl -l | grep -i zalo || echo "No Zalo windows found in wmctrl"
    echo ""
    echo "All windows:"
    wmctrl -l
elif command -v xdotool &> /dev/null; then
    echo "Using xdotool:"
    xdotool search --name "zalo" 2>/dev/null | head -5 || echo "No Zalo windows found"
else
    echo "⚠️  No window manager tools available"
    echo "Consider installing: sudo apt install wmctrl xdotool"
fi

echo ""
echo "🔄 Trying to focus/raise any Zalo windows..."

# Try to focus Zalo windows
if command -v wmctrl &> /dev/null; then
    wmctrl -a "zalo" 2>/dev/null || echo "No Zalo windows to focus"
elif command -v xdotool &> /dev/null; then
    window_id=$(xdotool search --name "zalo" 2>/dev/null | head -1)
    if [ ! -z "$window_id" ]; then
        echo "Found window ID: $window_id, trying to focus..."
        xdotool windowactivate $window_id 2>/dev/null || echo "Failed to activate"
    fi
fi

echo ""
echo "📱 Checking desktop environment:"
echo "DE: $XDG_CURRENT_DESKTOP"
echo "Session: $XDG_SESSION_TYPE"  
echo "Display: $DISPLAY"

echo ""
echo "🎯 Suggestions:"
echo "1. Check taskbar/dock for Zalo icon"
echo "2. Try Alt+Tab to see if windows are hidden"
echo "3. Check if windows are on different workspace/desktop"
echo "4. Look at system tray for Zalo icon" 