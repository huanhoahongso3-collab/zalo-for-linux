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

function executeCommand(command, description) {
  console.log(`🔧 ${description}...`);
  console.log(`📝 Command: ${command}`);
  
  try {
    const result = execSync(command, { 
      cwd: WORK_DIR, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    console.log('✅ Success!');
    return result;
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    if (error.stdout) console.log('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
    throw error;
  }
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
  const dmgPath = path.join(WORK_DIR, 'zalo.dmg');
  
  try {
    // Download DMG
    await downloadFile(DMG_URL, dmgPath);

    // On Linux, we need 7z to extract the DMG
    console.log('🐧 This is a Linux environment. Checking for required tools...');

    if (!commandExists('7z')) {
      console.error('❌ Dependency missing: 7z is not installed.');
      console.error('Please install it using: sudo apt-get install p7zip-full');
      throw new Error('7z is required for DMG extraction.');
    }

    console.log('✅ 7z is available.');
    
    // Extract using 7z
    executeCommand(`7z x "${dmgPath}" -o"${path.join(WORK_DIR, 'extracted_dmg')}"`, 'Extracting DMG with 7z');
    
    // The structure is often nested, find the actual app.asar
    const findAsarCommand = `find "${path.join(WORK_DIR, 'extracted_dmg')}" -name "app.asar" -type f`;
    const asarPaths = executeCommand(findAsarCommand, 'Finding app.asar').trim().split('\n').filter(Boolean);
    
    if (asarPaths.length === 0) {
      console.error('❌ Could not find app.asar in the extracted DMG files.');
      console.error('Please check the contents of the temp/extracted_dmg directory.');
      throw new Error('app.asar not found after extraction.');
    }
    
    // The first one is usually correct
    const asarPath = asarPaths[0];
    console.log('🎯 Found app.asar at:', asarPath);
    
    // Extract app.asar
    console.log('📂 Extracting app.asar...');
    const asarModule = require('asar');
    await asarModule.extractAll(asarPath, APP_DIR);
    
    console.log('✅ App extracted to:', APP_DIR);
    
    // Verify extraction
    if (fs.existsSync(path.join(APP_DIR, 'package.json'))) {
      const packageJson = JSON.parse(fs.readFileSync(path.join(APP_DIR, 'package.json'), 'utf8'));
      console.log('📋 App info:', packageJson.name, packageJson.version);
    }
    
    console.log('🎉 Extraction completed successfully!');
    
  } catch (error) {
    console.error('💥 Extraction failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (fs.existsSync(WORK_DIR)) {
      console.log('🧹 Cleaning up temporary files...');
      fs.rmSync(WORK_DIR, { recursive: true, force: true });
    }
  }
}

// Run extraction
extractDMG(); 