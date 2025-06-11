# Assets Directory

This directory contains application assets for Zalo for Linux.

## Icon Requirements

- **icon.png**: Main application icon (recommended: 512x512px PNG)
- The icon will be used for:
  - Application window
  - System tray (if supported)
  - AppImage metadata
  - Desktop integration

## Default Icon

If no icon is provided, the build process will attempt to download a default Electron icon from the official repository.

## Custom Icon

To use a custom icon:

1. Add your icon as `assets/icon.png`
2. Ensure it's in PNG format
3. Recommended size: 512x512 pixels
4. The icon should be square for best results

## Note

The icon file is not included in the repository to avoid potential copyright issues. The build process will handle icon creation automatically. 