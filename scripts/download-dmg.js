const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DMG_URL = process.env.DMG_URL || 'https://res-download-pc-te-vnso-pt-51.zadn.vn/mac/ZaloSetup-universal-25.5.3.dmg';
const WORK_DIR = path.join(__dirname, '..', 'temp');

console.log('📥 Starting Zalo DMG download process...');
console.log('📦 DMG URL:', DMG_URL);

// Create directories
if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
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

async function downloadDMG() {
  // Extract filename from URL
  const urlPath = new URL(DMG_URL).pathname;
  const dmgFilename = path.basename(urlPath) || 'zalo.dmg';
  const dmgPath = path.join(WORK_DIR, dmgFilename);
  
  console.log('📄 DMG filename:', dmgFilename);
  
  try {
    // Check if DMG already exists
    if (fs.existsSync(dmgPath)) {
      console.log('💾 DMG file already exists!');
      console.log('📄 Existing file:', dmgPath);
      
      // Ask if user wants to re-download
      const stats = fs.statSync(dmgPath);
      const fileSize = (stats.size / 1024 / 1024).toFixed(2);
      console.log('📊 File size:', fileSize, 'MB');
      console.log('📅 Created:', stats.birthtime.toLocaleString());
      
      console.log('💡 To force re-download, delete the existing file first or set FORCE_DOWNLOAD=true');
      
      if (!process.env.FORCE_DOWNLOAD) {
        console.log('✅ Download skipped - file already exists');
        return;
      }
      
      console.log('🔄 Force download enabled, removing existing file...');
      fs.unlinkSync(dmgPath);
    }

    // Download DMG
    await downloadFile(DMG_URL, dmgPath);
    
    // Verify file
    const stats = fs.statSync(dmgPath);
    const fileSize = (stats.size / 1024 / 1024).toFixed(2);
    console.log('📊 Downloaded file size:', fileSize, 'MB');
    
    console.log('🎉 Download completed successfully!');
    console.log(`💾 DMG file saved at: ${dmgPath}`);
    
  } catch (error) {
    console.error('💥 Download failed:', error.message);
    process.exit(1);
  }
}

// Run download
downloadDMG();
