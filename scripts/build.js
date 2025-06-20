#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Zalo for Linux...');

// Paths
const APP_PACKAGE_BACKUP_PATH = path.join(__dirname, '..', 'app', 'package.json.backup');
const BUILD_INFO_PATH = path.join(__dirname, '..', 'build-info.json');

try {
  // Read Zalo version from backup file
  if (!fs.existsSync(APP_PACKAGE_BACKUP_PATH)) {
    console.error('❌ app/package.json.backup not found.');
    console.error('💡 Please run "npm run extract-dmg" first to extract Zalo.');
    process.exit(1);
  }
  
  console.log('📱 Reading Zalo version from: package.json.backup');
  
  const appPackage = JSON.parse(fs.readFileSync(APP_PACKAGE_BACKUP_PATH, 'utf8'));
  const zaloVersion = appPackage.version;
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
  
  // Find built AppImage
  const distDir = path.join(__dirname, '..', 'dist');
  let appImageFile = null;
  let appImageName = null;
  let fileSize = null;
  let fileSha256 = null;
  
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
        
        // Store AppImage info
        if (f.endsWith('.AppImage')) {
          appImageFile = filePath;
          appImageName = f;
          fileSize = size;
          // Calculate SHA256
          try {
            const sha256Output = execSync(`sha256sum "${filePath}"`, { encoding: 'utf8' });
            fileSha256 = sha256Output.split(' ')[0];
          } catch (error) {
            console.warn('⚠️ Could not calculate SHA256');
          }
        }
        
        return `  • ${f} (${sizeStr})`;
      })
      .join('\n');
    console.log(files);
  }
  
  // Export build info for GitHub Actions
  const buildInfo = {
    releaseTag: zaloVersion,
    zaloName,
    appImageFile,
    appImageName,
    fileSize: fileSize ? (fileSize / 1024 / 1024).toFixed(2) + 'MB' : null,
    fileSha256
  };
  
  // Write to file for workflow
  fs.writeFileSync(BUILD_INFO_PATH, JSON.stringify(buildInfo, null, 2));
  
  // Export to GitHub Actions if running in CI
  if (process.env.GITHUB_OUTPUT) {
    const outputs = [
      `release_tag=${zaloVersion}`,
      `zalo_name=${zaloName}`,
      `appimage_file=${appImageFile || ''}`,
      `appimage_name=${appImageName || ''}`,
      `file_size=${buildInfo.fileSize || ''}`,
      `file_sha256=${fileSha256 || ''}`
    ];
    
    outputs.forEach(output => {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, output + '\n');
    });
    
    console.log('\n📋 Exported build info to GitHub Actions');
  }
  
  console.log(`\n🎉 Zalo ${zaloVersion} for Linux built successfully!`);
  
} catch (error) {
  console.error('💥 Build failed:', error.message);
  process.exit(1);
} 