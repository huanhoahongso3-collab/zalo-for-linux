const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Minimal wrapper - let Zalo do everything
function bootstrap() {
  // Check if extracted app exists
  // Try development path first, then production path
  const devPath = path.join(__dirname, 'app');
  const prodPath = path.join(path.dirname(process.execPath), 'app');
  
  let appPath = fs.existsSync(devPath) ? devPath : prodPath;
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