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

console.log('🎨 Preparing ZaDark dark theme...');

async function prepareZaDark() {
  try {
    // Check if ZaDark source already exists
    if (!fs.existsSync(ZADARK_DIR)) {
      console.log('📥 Cloning ZaDark repository...');
      
      // Ensure temp directory exists
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
      try {
        execSync('git pull origin main', {
          cwd: ZADARK_DIR,
          stdio: 'pipe'
        });
        console.log('✅ ZaDark source updated');
      } catch (error) {
        console.log('⚠️  Git pull failed, continuing with existing version');
      }
    }
    
    // Check if assets are built
    const assetsDir = path.join(ZADARK_DIR, 'build', 'pc', 'assets');
    if (!fs.existsSync(assetsDir)) {
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
    } else {
      console.log('✅ ZaDark PC assets already built');
    }
    
    // Verify assets exist
    const requiredAssets = [
      path.join(assetsDir, 'css'),
      path.join(assetsDir, 'js'), 
      path.join(assetsDir, 'libs'),
      path.join(assetsDir, 'fonts')
    ];
    
    const missingAssets = requiredAssets.filter(asset => !fs.existsSync(asset));
    if (missingAssets.length > 0) {
      console.error('❌ Missing required ZaDark assets:', missingAssets);
      process.exit(1);
    }
    
    console.log('🎉 ZaDark preparation completed successfully!');
    console.log(`📁 ZaDark ready at: ${ZADARK_DIR}`);
    console.log('💡 Run "npm run build" to create AppImages with ZaDark integration');
    
  } catch (error) {
    console.error('💥 ZaDark preparation failed:', error.message);
    process.exit(1);
  }
}

// Run preparation
prepareZaDark();
