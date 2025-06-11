#!/bin/bash

# Reset Zalo configuration script
# Author: doandat943

echo "🔄 Zalo Configuration Reset Tool"
echo "================================"

ZALO_CONFIG_DIR="$HOME/.config/ZaloData"

if [ ! -d "$ZALO_CONFIG_DIR" ]; then
    echo "✅ No Zalo config found - fresh start!"
    exit 0
fi

echo "📁 Current Zalo config: $ZALO_CONFIG_DIR"
echo "📊 Size: $(du -sh "$ZALO_CONFIG_DIR" | cut -f1)"
echo ""

echo "⚠️  This will:"
echo "  - Delete all Zalo settings and cache"
echo "  - Remove login session (you'll need to login again)"
echo "  - Clear chat history cache"
echo "  - Reset all preferences"
echo ""

read -p "❓ Are you sure you want to reset Zalo config? [y/N]: " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏭️  Reset cancelled."
    exit 0
fi

echo "💾 Creating backup first..."
BACKUP_DIR="$HOME/.config/ZaloData.backup.$(date +%Y%m%d_%H%M%S)"
if cp -r "$ZALO_CONFIG_DIR" "$BACKUP_DIR"; then
    echo "✅ Backup created: $BACKUP_DIR"
else
    echo "⚠️  Backup failed, continuing anyway..."
fi

echo "🗑️  Removing Zalo config..."
if rm -rf "$ZALO_CONFIG_DIR"; then
    echo "✅ Zalo config reset complete!"
    echo ""
    echo "🎉 Next steps:"
    echo "  1. Run Zalo AppImage again"
    echo "  2. Login with your account"
    echo "  3. Reconfigure your preferences"
    echo ""
    echo "💡 If you want to restore backup later:"
    echo "   mv '$BACKUP_DIR' '$ZALO_CONFIG_DIR'"
else
    echo "❌ Failed to remove config directory"
    echo "💡 You may need to run: sudo rm -rf '$ZALO_CONFIG_DIR'"
    exit 1
fi 