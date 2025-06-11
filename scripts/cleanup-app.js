const fs = require('fs');
const path = require('path');

const APP_PACKAGE_PATH = path.join(__dirname, '..', 'app', 'package.json');

console.log('🧹 Cleaning up app/package.json for build...');

if (!fs.existsSync(APP_PACKAGE_PATH)) {
  console.error('❌ app/package.json not found');
  process.exit(1);
}

try {
  // Read the original package.json
  const packageJson = JSON.parse(fs.readFileSync(APP_PACKAGE_PATH, 'utf8'));
  console.log('📋 Original app info:', packageJson.name, packageJson.version);

  // Create a backup
  const backupPath = APP_PACKAGE_PATH + '.backup';
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));
    console.log('💾 Backup created at:', backupPath);
  }

  // List of problematic dependencies to remove
  const problematicDeps = [
    'unload', // Private git repo that causes build failure
  ];

  // Clean up dependencies
  if (packageJson.dependencies) {
    let removedCount = 0;
    problematicDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        console.log(`🗑️  Removing problematic dependency: ${dep} = ${packageJson.dependencies[dep]}`);
        delete packageJson.dependencies[dep];
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      console.log(`✅ Removed ${removedCount} problematic dependencies`);
    } else {
      console.log('✅ No problematic dependencies found');
    }
  }

  // Remove development-specific scripts that might cause issues
  if (packageJson.scripts) {
    const scriptsToRemove = ['postinstall', 'preinstall', 'install'];
    scriptsToRemove.forEach(script => {
      if (packageJson.scripts[script]) {
        console.log(`🗑️  Removing script: ${script}`);
        delete packageJson.scripts[script];
      }
    });
  }

  // Remove dev dependencies since we don't need them for packaging
  if (packageJson.devDependencies) {
    console.log('🗑️  Removing devDependencies section');
    delete packageJson.devDependencies;
  }

  // Remove other problematic sections
  const sectionsToRemove = ['lint-staged', 'husky', 'engines'];
  sectionsToRemove.forEach(section => {
    if (packageJson[section]) {
      console.log(`🗑️  Removing section: ${section}`);
      delete packageJson[section];
    }
  });

  // Ensure we have a clean main entry point
  if (!packageJson.main || packageJson.main === 'bootstrap.js') {
    // Keep the original main file
    console.log('📝 Keeping main entry point:', packageJson.main);
  }

  // For build purposes, rename package.json to avoid electron-builder confusion
  const renamedPath = APP_PACKAGE_PATH + '.original';
  fs.writeFileSync(renamedPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Renamed package.json to package.json.original to avoid build conflicts');

  // Delete the original package.json to prevent electron-builder from detecting it
  if (fs.existsSync(APP_PACKAGE_PATH)) {
    fs.unlinkSync(APP_PACKAGE_PATH);
    console.log('🗑️  Removed app/package.json to prevent build conflicts');
  }

  console.log('🎉 App cleanup completed!');

} catch (error) {
  console.error('💥 Cleanup failed:', error.message);
  process.exit(1);
} 