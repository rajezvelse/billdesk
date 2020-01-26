import { app, BrowserWindow, Menu, Tray, BrowserWindowConstructorOptions, ipcMain, IpcMessageEvent } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { Settings } from './settings';

let argv = process.argv;
let devServer = argv.indexOf('--serve') >= 0;
let uiDistDir = `${path.join(__dirname, '..', '/ui')}`;


function createWindow() {
    let mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        icon: `${path.join(uiDistDir, '/assets/images/logo.png')}`,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    Settings.setWindow(mainWindow);

    // Importing web communication events
    require('./controllers');

    mainWindow.maximize();
    mainWindow.show();


    if (devServer) {
        console.log('Loading dev server')

        // get dynamic version from localhost:4200
        // require('electron-reload')(__dirname, {
        //     electron: require(`${__dirname}/../node_modules/electron`)
        // });
        mainWindow.loadURL('http://localhost:3000');

        // The following is optional and will open the DevTools:
        mainWindow.webContents.openDevTools();

    } else {

        mainWindow.loadURL(
            url.format({
                pathname: path.join(uiDistDir, 'index.html'),
                protocol: "file:",
                slashes: true
            })
        );

        mainWindow.webContents.openDevTools();
    }


    mainWindow.on('closed', () => {
        mainWindow = null;
    });

}

// Booting application
try {
    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
        app.quit();
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', createWindow);

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    // initialize the app's main window
    app.on("activate", () => {
        if (Settings.getWindow() === null) {
            createWindow();
        }
    });

} catch (e) {
    // Catch Error
    // throw e;
}


