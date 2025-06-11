const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Minimal wrapper - let Zalo do everything
function bootstrap() {
  // Check if extracted app exists
  const isDev = process.env.NODE_ENV === 'development';
  let appPath;
  
  if (isDev) {
    appPath = path.join(__dirname, 'app');
  } else {
    // Try different possible locations in packaged app
    const possiblePaths = [
      path.join(process.resourcesPath, 'app'),
      path.join(path.dirname(process.execPath), 'app'),
      path.join(__dirname, '..', 'app'),
      path.join(__dirname, 'app')
    ];
    
    appPath = possiblePaths.find(p => fs.existsSync(path.join(p, 'bootstrap.js')));
    
    if (!appPath) {
      console.error('Zalo app not found in any expected location:', possiblePaths);
      return;
    }
  }
  
  const bootstrapPath = path.join(appPath, 'bootstrap.js');

  if (fs.existsSync(bootstrapPath)) {
    console.log('Loading Zalo bootstrap from:', bootstrapPath);
    
    // Set the working directory to the app directory for Zalo
    process.chdir(appPath);
    
    // Let Zalo take full control
    try {
      require(bootstrapPath);
      console.log('Zalo bootstrap loaded - Zalo should handle everything from here');
    } catch (error) {
      console.error('Error loading Zalo:', error);
    }
  } else {
    console.error('Zalo bootstrap.js not found at:', bootstrapPath);
  }
}

// Skip normal Electron app setup and go straight to Zalo
bootstrap(); 