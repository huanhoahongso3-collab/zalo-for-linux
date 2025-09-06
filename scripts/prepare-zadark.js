#!/usr/bin/env node

/**
 * Prepare ZaDark - Clone and build ZaDark assets
 * This script prepares ZaDark for later integration during build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ZADARK_REPO = 'https://github.com/quaric/zadark.git';
const ZADARK_DIR = path.join(__dirname, '..', 'temp', 'zadark');

console.log('🎨 Preparing ZaDark...');

async function prepareZaDark() {
  try {
    await ensureZaDarkSource();
    await buildZaDarkAssets();
    await addRequiredExports();
    
    console.log('🎉 ZaDark preparation completed successfully!');
    console.log(`📁 ZaDark ready at: ${ZADARK_DIR}`);
    
  } catch (error) {
    console.error('💥 ZaDark preparation failed:', error.message);
    process.exit(1);
  }
}

async function ensureZaDarkSource() {
  if (!fs.existsSync(ZADARK_DIR)) {
    console.log('📥 Cloning ZaDark repository...');
    
    const tempDir = path.dirname(ZADARK_DIR);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    execSync(`git clone ${ZADARK_REPO} "${ZADARK_DIR}"`, {
      stdio: 'inherit',
      cwd: tempDir
    });
  } else {
    console.log('📁 ZaDark source found, checking for updates...');
    await updateZaDarkSource();
  }
}

async function updateZaDarkSource() {
  let sourceUpdated = false;
  
  try {
    // Pull latest changes (always use fresh code)
    sourceUpdated = await pullLatestChanges();
    
    // If source was updated, clean build artifacts to force rebuild
    if (sourceUpdated) {
      console.log('🧹 Cleaning old build artifacts...');
      const buildDir = path.join(ZADARK_DIR, 'build');
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
      }
      const nodeModules = path.join(ZADARK_DIR, 'node_modules');
      if (fs.existsSync(nodeModules)) {
        fs.rmSync(nodeModules, { recursive: true, force: true });
      }
    }
    
  } catch (error) {
    console.log('⚠️  Git operations failed, continuing with existing version');
    console.log('Error:', error.message);
  }
  
  return sourceUpdated;
}

async function pullLatestChanges() {
  const pullResult = execSync('git pull origin main', {
    cwd: ZADARK_DIR,
    stdio: 'pipe',
    encoding: 'utf8'
  });
  
  if (pullResult.includes('Already up to date')) {
    console.log('✅ ZaDark source is already up to date');
    return false;
  } else {
    console.log('✅ ZaDark source updated');
    return true;
  }
}

async function buildZaDarkAssets() {
  const assetsDir = path.join(ZADARK_DIR, 'build', 'pc', 'assets');
  const shouldBuildAssets = !fs.existsSync(assetsDir);
  
  if (!shouldBuildAssets) {
    console.log('✅ ZaDark PC assets already built and up to date');
    return;
  }
  
  console.log('🔨 Building ZaDark PC assets...');
  
  try {
    // Install dependencies
    console.log('📦 Installing ZaDark dependencies...');
    execSync('npm install --silent', {
      cwd: ZADARK_DIR,
      stdio: 'pipe'
    });
    
    // Build PC version
    console.log('⚙️  Building PC assets...');
    execSync('npm run build', {
      cwd: ZADARK_DIR,
      stdio: 'pipe'
    });
    
    console.log('✅ ZaDark PC assets built successfully');
  } catch (error) {
    console.error('❌ Failed to build ZaDark:', error.message);
    process.exit(1);
  }
}

async function addRequiredExports() {
  console.log('📝 Adding required exports to ZaDark module...');
  const zadarkModulePath = path.join(ZADARK_DIR, 'src', 'pc', 'zadark-pc.js');
  
  if (!fs.existsSync(zadarkModulePath)) {
    console.warn('⚠️  ZaDark module not found at expected location');
    return;
  }
  
  const zadarkContent = fs.readFileSync(zadarkModulePath, 'utf8');
  const requiredExports = ['copyZaDarkAssets', 'writeIndexFile', 'writeBootstrapFile', 'writePopupViewerFile'];
  const exportSection = zadarkContent.match(/module\.exports\s*=\s*\{[\s\S]*?\}/);
  
  if (!exportSection) {
    console.warn('⚠️  Could not find module.exports section');
    return;
  }
  
  const hasAllExports = requiredExports.every(func => exportSection[0].includes(func));
  
  if (hasAllExports) {
    console.log('✅ ZaDark module exports are already available');
    return;
  }
  
  console.log('🔧 Adding missing exports to ZaDark module...');
  
  const originalExports = exportSection[0];
  const updatedExports = originalExports.replace(
    /,\s*uninstallZaDark\s*\}/,
    `,
  uninstallZaDark,

  // Additional exports for build integration
  copyZaDarkAssets,
  writeIndexFile,
  writeBootstrapFile,
  writePopupViewerFile
}`
  );
  
  const updatedContent = zadarkContent.replace(exportSection[0], updatedExports);
  fs.writeFileSync(zadarkModulePath, updatedContent);
  console.log('✅ Added exports to ZaDark module');
}

// Run preparation
prepareZaDark();
