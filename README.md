# Zalo for Linux 🐧

[![Build Status](https://github.com/doandat943/zalo-for-linux/actions/workflows/build.yml/badge.svg)](https://github.com/doandat943/zalo-for-linux/actions/workflows/build.yml)

An unofficial, community-driven port of the Zalo desktop application for **Linux only**, created by repackaging the official macOS client into a standard AppImage.

## ⚠️ Important: Known Issues

- **Message Synchronization (E2EE):** Due to missing native macOS libraries for End-to-End Encryption, messages in encrypted chats **will not synchronize** automatically on a fresh install.
- **Workaround:** A community-found solution involves using **Wine** to run the Windows version of Zalo to perform the initial data sync, and then migrating the data to this Linux version. For more details, see [issue #1](https://github.com/realdtn2/zalo-linux-unofficial-2024/issues/1).

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

# Install project dependencies (Node.js required)
npm install

# Download and extract the latest Zalo macOS app.
# You can find the latest URL on the Zalo homepage.
DMG_URL="httpsa://res-download-pc-te-vnso-pt-51.zadn.vn/mac/ZaloSetup-universal-25.5.3.dmg" npm run extract-dmg

# Build the AppImage
npm run build
```
The final AppImage will be in the `dist/` directory.

## 🛠️ Development Scripts

- `npm start`: Runs the app in development mode without packaging.
- `npm run build`: Packages the application into an AppImage for Linux.
- `npm run extract-dmg`: Only performs the download and extraction step.
- `npm run reset-config`: Deletes the local Zalo data folder (`~/.config/ZaloData`) to fix potential corruption issues.
- `npm run test`: An interactive script for easy local testing and building.

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