#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Zalo for Linux...');

const BASE_DIR = path.join(__dirname, '..');
const TEMP_DIR = path.join(BASE_DIR, 'temp');
const APP_DIR = path.join(BASE_DIR, 'app');

const packageJsonPath = path.join(APP_DIR, 'package.json');
const buildInfoPath = path.join(BASE_DIR, 'build-info.json');

let ZALO_VERSION = null;
let ZALO_NAME = null;

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
      ZALO_NAME = packageJson.name;
      ZALO_VERSION = packageJson.version;
      
      console.log('📋 App info:', ZALO_NAME, ZALO_VERSION);
      
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
      
      const customProductName = `${ZALO_NAME}-${ZALO_VERSION}+ZaDark-${zadarkVersion}`;
      buildCommand = `npx electron-builder --linux -c.productName="${customProductName}"`;
      console.log(`🔨 Building${buildName ? ` ${buildName}` : ''} with Zalo: ${ZALO_VERSION}, ZaDark: ${zadarkVersion}`);
    } else {
      const customProductName = `${ZALO_NAME}-${ZALO_VERSION}`;
      buildCommand = `npx electron-builder --linux -c.productName="${customProductName}"`;
      console.log(`🔨 Building${buildName ? ` ${buildName}` : ''} with Zalo: ${ZALO_VERSION}`);
    }
    
    console.log(`📝 Command: ${buildCommand}`);
    
    execSync(buildCommand, { 
      stdio: 'inherit',
      cwd: path.join(BASE_DIR)
    });
    
    console.log(`✅ Completed!`);

      // Find built AppImage
      const distDir = path.join(BASE_DIR, 'dist');
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

      // Export build info for GitHub Actions (only for ZaDark build)
      if (outputSuffix === '-ZaDark') {
        const buildInfo = {
          releaseTag: ZALO_VERSION,
          zaloName: ZALO_NAME,
          appImageFile,
          appImageName,
          fileSize: fileSize ? (fileSize / 1024 / 1024).toFixed(2) + 'MB' : null,
          fileSha256
        };

        // Write to file for workflow
        fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

        // Export to GitHub Actions if running in CI
        if (process.env.GITHUB_OUTPUT) {
          const outputs = [
            `release_tag=${ZALO_VERSION}`,
            `zalo_name=${ZALO_NAME}`,
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
      }

    console.log(`\n🎉 Zalo ${ZALO_VERSION}${buildName ? ` ${buildName}` : ''} for Linux built successfully!`);
    
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