const fs = require('fs');
const path = require('path');

console.log('🔄 Syncing version with extracted Zalo app...');

// Paths
const PROJECT_PACKAGE_PATH = path.join(__dirname, '..', 'package.json');
const APP_PACKAGE_PATH = path.join(__dirname, '..', 'app', 'package.json.original');

try {
  // Check if app package exists
  if (!fs.existsSync(APP_PACKAGE_PATH)) {
    console.error('❌ app/package.json.original not found. Please extract Zalo first.');
    process.exit(1);
  }

  // Read app package.json to get Zalo version
  const appPackage = JSON.parse(fs.readFileSync(APP_PACKAGE_PATH, 'utf8'));
  const zaloVersion = appPackage.version;
  const zaloName = appPackage.name;

  console.log(`📱 Detected ${zaloName} version: ${zaloVersion}`);

  // Read project package.json
  const projectPackage = JSON.parse(fs.readFileSync(PROJECT_PACKAGE_PATH, 'utf8'));
  const currentVersion = projectPackage.version;

  console.log(`📦 Current project version: ${currentVersion}`);

  if (currentVersion === zaloVersion) {
    console.log('✅ Versions already match, no changes needed');
    process.exit(0);
  }

  // Update project version to match Zalo version
  projectPackage.version = zaloVersion;

  // Write updated package.json
  fs.writeFileSync(PROJECT_PACKAGE_PATH, JSON.stringify(projectPackage, null, 2));

  console.log(`✅ Updated project version: ${currentVersion} → ${zaloVersion}`);
  console.log('🎉 Version sync completed!');

} catch (error) {
  console.error('💥 Version sync failed:', error.message);
  process.exit(1);
} 