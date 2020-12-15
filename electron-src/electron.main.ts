import "reflect-metadata";
import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { Settings } from './settings';

import * as unhandled from 'electron-unhandled';
 
// Error handling
unhandled();

let argv = process.argv;
let devServer = argv.indexOf('--serve') >= 0;
let uiDistDir = `${path.join(__dirname, '..', '/ui')}`;


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    frame: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  Menu.setApplicationMenu(null);
  
  Settings.setWindow(mainWindow);

  // Importing web communication events
  require('./controllers');

  mainWindow.maximize();
  mainWindow.show();


  if (devServer) {
    console.log('Loading dev server')

    // get dynamic version from localhost:3000
    mainWindow.loadURL('http://localhost:3000');

    // The following is optional and will open the DevTools:
    mainWindow.webContents.openDevTools();

  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(uiDistDir, 'index.html'),
        protocol: "file:",
        slashes: true,
      })
    );

    // mainWindow.webContents.openDevTools();
  }

}

// Booting application
try {
  app.whenReady().then(createWindow);
} catch (e) {
  // Catch Error
  throw e;
}