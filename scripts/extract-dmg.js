const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DMG_URL = process.env.DMG_URL || 'https://res-download-pc-te-vnso-pt-51.zadn.vn/mac/ZaloSetup-universal-25.5.3.dmg';
const WORK_DIR = path.join(__dirname, '..', 'temp');
const APP_DIR = path.join(__dirname, '..', 'app');

console.log('🔧 Starting Zalo DMG extraction process...');
console.log('📂 Work directory:', WORK_DIR);

// Create directories
if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

if (fs.existsSync(APP_DIR)) {
  fs.rmSync(APP_DIR, { recursive: true, force: true });
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
    // Check if DMG file exists
    if (!fs.existsSync(dmgPath)) {
      console.error('❌ DMG file not found:', dmgPath);
      console.error('💡 Please run "npm run download-dmg" first to download the DMG file.');
      throw new Error('DMG file not found. Download it first.');
    }
    
    console.log('💾 Found DMG file:', dmgPath);
    const stats = fs.statSync(dmgPath);
    const fileSize = (stats.size / 1024 / 1024).toFixed(2);
    console.log('📊 DMG file size:', fileSize, 'MB');

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