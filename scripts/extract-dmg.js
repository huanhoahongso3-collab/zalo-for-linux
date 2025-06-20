const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

const DMG_URL = process.env.DMG_URL || 'https://res-download-pc-te-vnso-pt-51.zadn.vn/mac/ZaloSetup-universal-25.5.3.dmg';
const WORK_DIR = path.join(__dirname, '..', 'temp');
const APP_DIR = path.join(__dirname, '..', 'app');

console.log('🚀 Starting Zalo DMG extraction process...');
console.log('📦 DMG URL:', DMG_URL);

// Create directories
if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

if (fs.existsSync(APP_DIR)) {
  fs.rmSync(APP_DIR, { recursive: true, force: true });
}

async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log('📥 Downloading DMG file...');
    
    const request = (url.startsWith('https') ? https : http).get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        return downloadFile(response.headers.location, destination);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      const fileStream = fs.createWriteStream(destination);
      const totalSize = parseInt(response.headers['content-length'] || '0');
      let downloadedSize = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = totalSize > 0 ? ((downloadedSize / totalSize) * 100).toFixed(1) : 'Unknown';
        process.stdout.write(`\r📊 Progress: ${progress}% (${Math.round(downloadedSize / 1024 / 1024)}MB)`);
      });

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log('\n✅ Download completed!');
        resolve();
      });

      fileStream.on('error', reject);
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

function commandExists(command) {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

async function extractDMG() {
  // Extract filename from URL
  const urlPath = new URL(DMG_URL).pathname;
  const dmgFilename = path.basename(urlPath) || 'zalo.dmg';
  const dmgPath = path.join(WORK_DIR, dmgFilename);
  
  console.log('📄 DMG filename:', dmgFilename);
  
  try {
    // Download DMG (skip if already exists)
    if (fs.existsSync(dmgPath)) {
      console.log('💾 DMG file already exists, skipping download');
      console.log('📄 Using existing file:', dmgPath);
    } else {
      await downloadFile(DMG_URL, dmgPath);
    }

    // Check for 7z
    console.log('🐧 Checking for required tools...');
    if (!commandExists('7z')) {
      console.error('❌ Dependency missing: 7z is not installed.');
      console.error('Please install it using: sudo apt-get install p7zip-full');
      throw new Error('7z is required for DMG extraction.');
    }
    console.log('✅ 7z is available.');
    
    // Extract app.asar and app.asar.unpacked directly using the optimized command
    console.log('🔧 Extracting app.asar and app.asar.unpacked from DMG...');
    const extractCommand = `7z x "${dmgPath}" "Zalo*/Zalo.app/Contents/Resources/app.asar*"`;
    
    try {
      execSync(extractCommand, { 
        cwd: WORK_DIR,
        stdio: 'pipe' // Suppress output to avoid seeing the "Headers Error" 
      });
    } catch (error) {
      // 7z might report "Headers Error" but still extract successfully
      // Check if app.asar was extracted anyway
      console.log('⚠️  7z reported warnings/errors (this is normal for DMG files)');
    }
    
    // Find Resources directory (contains both app.asar and app.asar.unpacked)
    console.log('🔍 Looking for Zalo Resources directory...');
    const findResourcesCommand = `find "${WORK_DIR}" -path "*/Zalo.app/Contents/Resources" -type d`;
    let resourcesPaths;
    
    try {
      const result = execSync(findResourcesCommand, { 
        cwd: WORK_DIR,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      resourcesPaths = result.trim().split('\n').filter(Boolean);
    } catch (error) {
      resourcesPaths = [];
    }
    
    const resourcesPath = resourcesPaths[0];
    
    console.log('🎯 Found Resources at:', resourcesPath);
    
    // Extract app.asar to final location (asar module will automatically handle unpacked files)
    console.log('📂 Extracting app.asar to app directory...');
    const asarModule = require('@electron/asar');
    
    // Set the working directory to Resources so that unpacked files are resolved correctly
    const originalCwd = process.cwd();
    try {
      process.chdir(resourcesPath);
      await asarModule.extractAll('app.asar', APP_DIR);
    } finally {
      process.chdir(originalCwd);
    }
    
    // Clean up extracted folders
    console.log('🧹 Cleaning up extracted folders...');
    const zaloFolders = execSync(`find "${WORK_DIR}" -name "Zalo*" -type d`, { 
      cwd: WORK_DIR,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim().split('\n').filter(Boolean);
    
    // Remove extracted folders
    zaloFolders.forEach(folder => {
      if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
      }
    });
    
    console.log('✅ App extracted to:', APP_DIR);
    
    // Rename package.json to package.json.backup to prevent electron-builder conflicts
    const packageJsonPath = path.join(APP_DIR, 'package.json');
    const packageJsonBackupPath = path.join(APP_DIR, 'package.json.backup');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log('📋 App info:', packageJson.name, packageJson.version);
      
      // Rename to backup
      fs.renameSync(packageJsonPath, packageJsonBackupPath);
      console.log('📁 Renamed package.json → package.json.backup');
    } else {
      console.warn('⚠️  package.json not found in extracted app');
    }
    
    console.log('🎉 Extraction completed successfully!');
    
  } catch (error) {
    console.error('💥 Extraction failed:', error.message);
    process.exit(1);
  }
  
  console.log(`💾 DMG file preserved at: ${dmgPath}`);
  console.log(`📁 Temp directory preserved at: ${WORK_DIR}`);
}

// Run extraction
extractDMG(); 