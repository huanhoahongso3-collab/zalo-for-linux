#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Zalo for Linux...');

// Paths
const APP_PACKAGE_BACKUP_PATH = path.join(__dirname, '..', 'app', 'package.json.backup');

try {
  // Read Zalo version from backup file
  if (!fs.existsSync(APP_PACKAGE_BACKUP_PATH)) {
    console.error('❌ app/package.json.backup not found.');
    console.error('💡 Please run "npm run extract-dmg" first to extract Zalo.');
    process.exit(1);
  }
  
  console.log('📱 Reading Zalo version from: package.json.backup');
  
  const appPackage = JSON.parse(fs.readFileSync(APP_PACKAGE_BACKUP_PATH, 'utf8'));
  zaloVersion = appPackage.version;
  const zaloName = appPackage.name;
  
  if (!zaloVersion) {
    console.error('❌ No version found in app package.json');
    process.exit(1);
  }
  
  console.log(`📦 Detected ${zaloName} version: ${zaloVersion}`);
  
  // Build with Zalo version
  const buildCommand = `npx electron-builder --linux -c.extraMetadata.version=${zaloVersion}`;
  
  console.log(`🔨 Building with version: ${zaloVersion}`);
  console.log(`📝 Command: ${buildCommand}`);
  
  execSync(buildCommand, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Build completed successfully!');
  
  // Show built files
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    console.log('\n📁 Built files:');
    const files = fs.readdirSync(distDir)
      .filter(f => f.endsWith('.AppImage') || f.endsWith('.yml'))
      .sort()
      .map(f => {
        const filePath = path.join(distDir, f);
        const size = fs.statSync(filePath).size;
        const sizeStr = size > 1024 * 1024 
          ? `${Math.round(size / 1024 / 1024)}MB`
          : `${Math.round(size / 1024)}KB`;
        return `  • ${f} (${sizeStr})`;
      })
      .join('\n');
    console.log(files);
  }
  
  console.log(`\n🎉 Zalo ${zaloVersion} for Linux built successfully!`);
  console.log(`\n💡 To build with custom version, use:`);
  console.log(`   npx electron-builder --linux -c.extraMetadata.version=YOUR_VERSION`);
  
} catch (error) {
  console.error('💥 Build failed:', error.message);
  process.exit(1);
} 