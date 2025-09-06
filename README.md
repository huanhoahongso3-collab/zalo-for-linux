# Zalo for Linux 🐧

[![Build Status](https://github.com/doandat943/zalo-for-linux/actions/workflows/build.yml/badge.svg)](https://github.com/doandat943/zalo-for-linux/actions/workflows/build.yml)

An unofficial, community-driven port of the Zalo desktop application for **Linux only**, created by repackaging the official macOS client into a standard AppImage with integrated ZaDark.

## ⚠️ Important: Known Issues

- **Message Synchronization (E2EE):** Due to missing native macOS libraries for End-to-End Encryption, messages in encrypted chats **will not synchronize** automatically on a fresh install.
- **Workaround:** A community-found solution involves using **Wine** to run the Windows version of Zalo to perform the initial data sync, and then migrating the data to this Linux version. For more details, see [issue #1](https://github.com/realdtn2/zalo-linux-unofficial-2024/issues/1).
- **Can't make or receive calls:** Due to missing native macOS libraries
- **No Photos/Videos, Files and Links on the Conversation Info panel** for some reason (you can still viewing image/video, file or link like normal, it just don't appear on the conversation info panel like this)
- There is **no Minimize, Maximize or Close button:** The macOS title bar is not available when porting to Linux
- Crash when click **Screenshot without Zalo window button**

This project is best suited for users who need a native-feeling Zalo client on Linux and are comfortable with the technical workarounds required for full functionality.

## 🚀 Quick Start

### 1. System Requirements
- A 64-bit Linux distribution.
- **`7z` (p7zip-full):** Required to extract the Zalo application.
  ```bash
  # On Debian/Ubuntu
  sudo apt-get update && sudo apt-get install p7zip-full
  ```

### 2. Download Pre-built AppImage (Recommended)

1.  Go to the [**Releases**](https://github.com/doandat943/zalo-for-linux/releases) page.
2.  Download the latest `.AppImage` file.
3.  Make it executable: `chmod +x Zalo-*.AppImage`
4.  Run it: `./Zalo-*.AppImage`

### 3. Build from Source

If you prefer to build it yourself:

```bash
# Clone the repository
git clone https://github.com/doandat943/zalo-for-linux.git
cd zalo-for-linux

# Option 1: Auto-download latest version (recommended)
npm run setup

# Option 2: Download specific version
DMG_VERSION="25.8.2" npm run setup

# Build AppImage
npm run build
```
The final AppImage will be in the `dist/` directory!

## 🌙 ZaDark Integration

This project includes integrated [ZaDark](https://github.com/quaric/zadark) by default, ZaDark is an extension that helps you enable Dark Mode, more privacy features, and additional functionality.

**ZaDark helps you experience Zalo 🔒 more privately ✨ more personalized.**

### Features
- 🌙 **Dark Mode optimized specifically for Zalo** - Complete dark theme tailored for Zalo interface
- 🆃 **Customize fonts and font sizes** - Personalize text appearance to your preference  
- 🖼️ **Custom chat backgrounds** - Set personalized backgrounds for conversations
- 🔤 **Quick message translation** - Instantly translate messages to your preferred language
- 😊 **Express emotions with 80+ Emojis** - Enhanced emoji reactions for messages
- 🔒 **Anti-message peeking protection** - Prevent others from secretly viewing your messages
- 👁️ **Hide status indicators** - Hide "typing", "delivered" and "read" status from others
- 📱 **Native Integration** - Seamlessly integrated during build process

### Usage

**Complete Workflow:**
```bash
# Setup (downloads Zalo + prepares ZaDark)
npm run setup

# Build ZaDark-integrated version
npm run build
```

**What happens during setup:**
1. 📥 Downloads latest Zalo DMG from official source
2. 📦 Extracts Zalo app from DMG file
3. 🎨 **Prepares ZaDark** - clones repository and builds assets
4. 🌙 **Integrates ZaDark** - applies enhancements and utilities during extraction
5. ✅ Everything ready for building!

**What happens when you build:**
1. 🌙 **ZaDark version**: `Zalo-X.X.X.AppImage` - Clean filename with integrated ZaDark enhancements

**Individual Commands:**
```bash
npm run download-dmg     # Download Zalo DMG only
npm run extract-dmg      # Extract and integrate ZaDark into Zalo app
npm run prepare-zadark   # Prepare ZaDark assets only
npm run build           # Build ZaDark-integrated AppImage
```

> **Note:** ZaDark is licensed under MPL-2.0 and is developed by [Quaric](https://zadark.com). The setup process automatically prepares ZaDark, and build process integrates it seamlessly!

## 🛠️ Development Scripts

- `npm start`: Runs the app in development mode without packaging.
- `npm run build`: Builds ZaDark-integrated AppImage version.
- `npm run download-dmg`: Downloads the latest Zalo DMG file automatically, or uses DMG_VERSION if provided.
- `npm run extract-dmg`: Extracts the Zalo app from an existing DMG file (shows interactive selection menu if multiple DMG files exist, unless DMG_VERSION is specified for auto-selection).
- `npm run prepare-zadark`: Clones and builds ZaDark assets for later integration.
- `npm run setup`: Complete setup workflow (equivalent to `download-dmg` + `extract-dmg` + `prepare-zadark`).

### 📥 Download Modes  

The download script supports two simple modes:

**🆕 Auto Mode (Default - Recommended):**
```bash
npm run download-dmg
# Automatically downloads the latest Zalo version from https://zalo.me/download/zalo-pc
# Handles multiple redirects and shows detailed progress for large files
```

**🎯 Version Mode (Super Convenient):**
```bash
DMG_VERSION="25.8.2" npm run download-dmg
# Just specify the version number! Script constructs the URL automatically
# Uses pattern: https://res-download-pc.zadn.vn/mac/ZaloSetup-universal-VERSION.dmg
# Zalo servers handle redirect to the actual download location
```

**🔄 Force Re-download:**
```bash
FORCE_DOWNLOAD=true npm run download-dmg
# Forces re-download even if file already exists
```

### 🎯 Usage Examples

**Quick workflows:**
```bash
# Download latest + extract (may require interaction if multiple DMG files exist)
npm run setup

# Download specific version easily  
DMG_VERSION="26.1.0" npm run download-dmg

# Download + extract specific version (FULLY AUTOMATED - no interaction needed)
DMG_VERSION="25.8.2" npm run setup
```

### 🤖 Fully Automated Setup

When using `DMG_VERSION`, the entire workflow runs without user interaction:

```bash
# Completely automated - no user input required
DMG_VERSION="25.8.2" npm run setup

# This will:
# 1. npm install (no interaction)
# 2. Download version 25.8.2 (no interaction) 
# 3. Auto-select version 25.8.2 for extraction (no interaction)
# 4. Extract to app/ directory (no interaction)
```

**Perfect for CI/CD, scripts, and automated deployments!**

## 📋 Quick Command Reference

| **Use Case** | **Command** | **User Interaction?** |
|--------------|-------------|----------------------|
| 🚀 **Complete workflow** | `npm run setup && npm run build` | ⚠️ Maybe (if multiple DMG files) |
| 🤖 **Fully automated** | `DMG_VERSION="25.8.2" npm run setup && npm run build` | ❌ **Never** |
| 📥 Download only | `npm run download-dmg` | ❌ Never |
| 📥 Download specific version | `DMG_VERSION="25.8.2" npm run download-dmg` | ❌ Never |
| 🔧 Extract only | `npm run extract-dmg` | ⚠️ Maybe (interactive menu) |
| 🔧 **Extract specific version** | `DMG_VERSION="25.8.2" npm run extract-dmg` | ❌ **Never** |
| 🎨 Prepare ZaDark only | `npm run prepare-zadark` | ❌ Never |
| 👨‍💻 Development testing | `npm start` | ❌ Never |
| 🏗️ **Build integrated version** | `npm run build` | ❌ Never |

## 🌍 Environment Variables

| **Variable** | **Description** | **Example** |
|-------------|----------------|-------------|
| `DMG_VERSION` | Specify exact Zalo version to download/extract | `DMG_VERSION="25.8.2"` |
| `FORCE_DOWNLOAD` | Force re-download even if file exists | `FORCE_DOWNLOAD=true` |

**Combine variables:**
```bash
# Example: Download specific version with force re-download
DMG_VERSION="25.8.2" FORCE_DOWNLOAD=true npm run setup
```

### 🎯 Interactive DMG Selection

When running `npm run extract-dmg` with multiple DMG files in the `temp/` directory:

- **📋 Modern interface**: Arrow key navigation with radio button selection
- **🔍 Smart sorting**: Files ordered by version (highest first), then by date
- **📊 Detailed info**: Displays version, file size, and download date for each option
- **⚡ Intuitive controls**: Use ↑↓ arrows to navigate, Enter to select, Esc to cancel
- **🎯 Single file**: Auto-selects if only one DMG file exists

**Example interactive session:**
```
📋 Available DMG files:
   Use ↑↓ arrow keys to navigate, Enter to select, Esc to cancel

  ● ZaloSetup-universal-26.1.0.dmg
    Version: v26.1.0 | Size: 198.5MB | Date: 12/20/2024, 3:45:12 PM

  ○ ZaloSetup-universal-25.8.2.dmg
    Version: v25.8.2 | Size: 195.2MB | Date: 12/15/2024, 10:23:45 AM

  ○ ZaloSetup-universal-25.5.3.dmg
    Version: v25.5.3 | Size: 192.1MB | Date: 12/10/2024, 2:15:30 PM

🎯 Selected: ZaloSetup-universal-26.1.0.dmg (v26.1.0)
```

**Navigation:**
- **↑↓** Arrow keys to move selection
- **Enter** to confirm selection  
- **Esc** or **Ctrl+C** to cancel

## 📁 Project Structure After Setup

After running `npm run setup`, your project will look like:

```
zalo-for-linux/
├── app/                     # ✅ Extracted Zalo app (ready for Electron)
│   ├── package.json.backup  # Zalo version info for builds
│   ├── main.js              # Main Electron entry point
│   ├── pc-dist/             # Web assets, icons, styles
│   └── native/              # Native modules and bindings
├── temp/                    # Downloaded DMG files (preserved)
│   └── ZaloSetup-universal-*.dmg
├── dist/                    # Built AppImage (after npm run build)
│   └── Zalo-*.AppImage              # 🌙 ZaDark-integrated version
├── main.js                  # Electron wrapper for Linux
└── package.json             # Project configuration
```

## ❓ Troubleshooting

### **🔍 Common Issues:**

**Q: Extract shows "No DMG files found"**
```bash
# Solution: Download first
npm run download-dmg
# Then extract
npm run extract-dmg
```

**Q: Extract shows interactive menu but I want automation**
```bash
# Solution: Use DMG_VERSION for auto-selection
DMG_VERSION="25.8.2" npm run extract-dmg
```

**Q: Download fails with 404 error**
```bash
# The version doesn't exist. Check latest version:
npm run download-dmg  # This will show the latest available version
```

**Q: Build fails with "package.json.backup not found"**
```bash
# Solution: Run extract first
npm run setup  # This runs download + extract
npm run build
```

**Q: Want to switch to different Zalo version**
```bash
# Solution: Force download new version
DMG_VERSION="26.1.0" FORCE_DOWNLOAD=true npm run setup
```

### **📞 Need Help?**
1. Check [Issues](https://github.com/doandat943/zalo-for-linux/issues) for known problems
2. Run `npm run setup` for the complete workflow
3. Use `DMG_VERSION="X.X.X"` for specific versions

## ⚙️ How It Works

This project is not a from-scratch rewrite of Zalo. It works by:
1.  Downloading the official macOS `.dmg` file.
2.  Using `7z` to extract the `app.asar` archive, which contains the main application logic written in JavaScript.
3.  Removing incompatible native macOS files.
4.  Wrapping the extracted application in a minimal, Linux-compatible Electron shell.
5.  Using `electron-builder` to package everything into a single, portable `AppImage` file.

## 🤝 Contributing

Contributions are welcome, especially for improving Linux integration, fixing bugs, and enhancing the build scripts.

1.  Fork the repository.
2.  Create your feature branch.
3.  Commit your changes.
4.  Submit a Pull Request.

## 📄 License

This project is licensed under the MIT License. Zalo is a trademark of VNG Corporation. This project is not affiliated with or endorsed by VNG Corporation. 