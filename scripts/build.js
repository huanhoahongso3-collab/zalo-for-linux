#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Zalo for Linux...');

const BASE_DIR = path.join(__dirname, '..');
const TEMP_DIR = path.join(BASE_DIR, 'temp');
const APP_DIR = path.join(BASE_DIR, 'app');

const packageJsonPath = path.join(APP_DIR, 'package.json');

let ZALO_VERSION = null;

async function extractAppAsar() {
    // Find Resources directory (contains both app.asar and app.asar.unpacked)
    console.log('🔍 Looking for Zalo Resources directory...');
    const findResourcesCommand = `find "${TEMP_DIR}" -path "*/Zalo.app/Contents/Resources" -type d`;
    let resourcesPaths;
    
    try {
      const result = execSync(findResourcesCommand, { 
        cwd: TEMP_DIR,
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
    
    console.log('✅ App extracted to:', APP_DIR);
    
    // Read app info and remove package.json to prevent electron-builder conflicts
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Store in global variables
      ZALO_VERSION = packageJson.version;
      
      // Export common info to GitHub Actions (immediately after reading version)
      if (process.env.GITHUB_OUTPUT) {
        const releaseTag = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
        
        const commonOutputs = [
          `release_tag=${releaseTag}`,
          `zalo_version=${ZALO_VERSION}`
        ];
        commonOutputs.forEach(output => {
          fs.appendFileSync(process.env.GITHUB_OUTPUT, output + '\n');
        });
      }
      
      // Remove package.json to prevent electron-builder conflicts
      fs.unlinkSync(packageJsonPath);
      console.log('🗑️  Removed package.json (stored version info)');
    } else {
      console.warn('⚠️  package.json not found in extracted app');
    }
    
    // Clean up extracted DMG folders
    console.log('🧹 Cleaning up extracted folders...');
    const zaloFolders = execSync(`find "${TEMP_DIR}" -name "Zalo*" -type d`, { 
      cwd: TEMP_DIR,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim().split('\n').filter(Boolean);
    
    zaloFolders.forEach(folder => {
      if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
      }
    });
}

async function ZaDarkIntegration() {
  // ZaDark Integration (always applied in this project)
  console.log('🎨 Applying ZaDark patches...');
    
  try {
    // Verify ZaDark module is available
    const zadarkModulePath = path.join(BASE_DIR, 'temp', 'zadark', 'build', 'pc', 'zadark-pc.js');
    if (!fs.existsSync(zadarkModulePath)) {
      throw new Error('ZaDark PC module not found - run "npm run prepare-zadark" first');
    }
    
    // Import ZaDark PC module
    console.log('🎯 Applying ZaDark patches to app directory...');

    const zadarkPC = require(zadarkModulePath);
    zadarkPC.copyZaDarkAssets(BASE_DIR);
    zadarkPC.writeIndexFile(BASE_DIR);
    zadarkPC.writeBootstrapFile(BASE_DIR);
    zadarkPC.writePopupViewerFile(BASE_DIR);
    console.log('✅ ZaDark patches applied successfully');
    
  } catch (error) {
    console.error('❌ ZaDark integration failed:', error.message);
    console.log('💡 Continuing with original app directory...');
  }
}

async function buildZalo(buildName = '', outputSuffix = '') {
  try {
    // Build with custom product name if suffix provided
    let buildCommand;
    if (outputSuffix === '-ZaDark') {
      // Read ZaDark version for custom naming
      const zadarkPackagePath = path.join(BASE_DIR, 'temp', 'zadark', 'package.json');
      let zadarkVersion = 'unknown';
      
      if (fs.existsSync(zadarkPackagePath)) {
        try {
          const zadarkPackage = JSON.parse(fs.readFileSync(zadarkPackagePath, 'utf8'));
          zadarkVersion = zadarkPackage.version;
        } catch (error) {
          console.warn('⚠️ Could not read ZaDark version, using "unknown"');
        }
      }
      
      const customProductName = `Zalo-${ZALO_VERSION}+ZaDark-${zadarkVersion}`;
      buildCommand = `npx electron-builder --linux -c.productName="${customProductName}"`;
      console.log(`🔨 Building${buildName ? ` ${buildName}` : ''} with Zalo: ${ZALO_VERSION}, ZaDark: ${zadarkVersion}`);
    } else {
      const customProductName = `Zalo-${ZALO_VERSION}`;
      buildCommand = `npx electron-builder --linux -c.productName="${customProductName}"`;
      console.log(`🔨 Building${buildName ? ` ${buildName}` : ''} with Zalo: ${ZALO_VERSION}`);
    }
    
    console.log(`📝 Command: ${buildCommand}`);
    
    // Capture build output to get file information
    const buildOutput = execSync(buildCommand, { 
      stdio: 'pipe',
      cwd: path.join(BASE_DIR),
      encoding: 'utf8'
    });
    
    console.log(`✅ Completed!`);
    
    // Debug: Show build output
    console.log('\n🔍 Build Output:');
    console.log(buildOutput);
    
    // Parse build output to find AppImage file
    const appImageMatch = buildOutput.match(/file=(dist\/.*\.AppImage)/);
    let appImageFile = null;
    let appImageName = null;
    let fileSize = null;
    let fileSha256 = null;
    
    if (appImageMatch) {
      appImageFile = appImageMatch[1];
      appImageName = path.basename(appImageFile);
      
      console.log(`📦 AppImage: ${appImageFile}`);
      
      // Get file size
      if (fs.existsSync(appImageFile)) {
        fileSize = fs.statSync(appImageFile).size;
        
        console.log(`📏 Size: ${fileSize} bytes`);
        
        // Calculate SHA256
        try {
          const sha256Output = execSync(`sha256sum "${appImageFile}"`, { encoding: 'utf8' });
          fileSha256 = sha256Output.split(' ')[0];
          console.log(`🔐 SHA256: ${fileSha256}`);
        } catch (error) {
          console.warn('⚠️ Could not calculate SHA256');
        }
      } else {
        console.warn(`⚠️ AppImage file not found: ${appImageFile}`);
      }
    } else {
      console.warn('⚠️ Could not find AppImage in build output');
    }

      // Export build info to GitHub Actions
      if (process.env.GITHUB_OUTPUT) {
        const fileSizeMB = fileSize ? (fileSize / 1024 / 1024).toFixed(2) + 'MB' : '';
        const prefix = outputSuffix === '-ZaDark' ? 'zadark_' : 'original_';
        
        // Export build-specific info
        const specificOutputs = [
          `${prefix}appimage_file=${appImageFile || ''}`,
          `${prefix}appimage_name=${appImageName || ''}`,
          `${prefix}file_size=${fileSizeMB}`,
          `${prefix}file_sha256=${fileSha256 || ''}`
        ];
        
        specificOutputs.forEach(output => {
          fs.appendFileSync(process.env.GITHUB_OUTPUT, output + '\n');
        });

        console.log(`\n📋 Exported ${prefix.replace('_', '')} build info to GitHub Actions`);
      }
  } catch (error) {
    console.error('💥 Build failed:', error.message);
    process.exit(1);
  }
}

// Main workflow execution
async function main() {
  try {
    // Phase 1: Extract asar and build original Zalo
    console.log('\n🔥 PHASE 1: Building Zalo (Original)...\n');
    
    await extractAppAsar();
    await buildZalo('(Original)', '');
    
    // Phase 2: Apply ZaDark integration and build final product
    console.log('\n🔥 PHASE 2: Building Zalo (with ZaDark)...\n');
    
    // Patch ZaDark directly into APP_DIR
    await ZaDarkIntegration();
    await buildZalo('(with ZaDark)', '-ZaDark');
    
    // Final summary
    console.log('\n🎉 ===== BUILD SUMMARY =====');
    const distDir = path.join(BASE_DIR, 'dist');
    
    if (fs.existsSync(distDir)) {
      const allFiles = fs.readdirSync(distDir)
        .filter(f => f.endsWith('.AppImage'))
        .sort()
        .map(f => {
          const filePath = path.join(distDir, f);
          const size = fs.statSync(filePath).size;
          const sizeStr = size > 1024 * 1024 
            ? `${Math.round(size / 1024 / 1024)}MB`
            : `${Math.round(size / 1024)}KB`;
          
          const type = f.includes('+ZaDark-') ? '🎨 ZaDark' : '📦 Original';
          return `  ${type} • ${f} (${sizeStr})`;
        })
        .join('\n') || '  (no AppImage files)';
      
      console.log('\n📁 All built files in dist/:');
      console.log(allFiles);
    }
    
  } catch (error) {
    console.error('💥 Main workflow failed:', error.message);
    process.exit(1);
  }
}

// Start the workflow
main();