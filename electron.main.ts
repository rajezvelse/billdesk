import { app, BrowserWindow, Menu, Tray, BrowserWindowConstructorOptions } from 'electron';
import * as path from 'path';
import * as url from 'url';

let win: BrowserWindow = null;

const args = process.argv;
let devServer = args.indexOf('--serve') >= 0;

let ngDistDir = `${path.join(__dirname, '/app')}`;


function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: `file://${path.join(__dirname, ngDistDir, '/assets/images/logo.png')}`,
        skipTaskbar: false,
        webPreferences: {
            sandbox: false
            // nodeIntegration: true
        }
    });

    if (devServer) {

        // get dynamic version from localhost:4200
        require('electron-reload')(__dirname, {
            electron: require(`${__dirname}/node_modules/electron`)
        });
        win.loadURL('http://localhost:4200');

        // The following is optional and will open the DevTools:
        win.webContents.openDevTools();

    } else {
        console.log(path.join(ngDistDir, 'index.html'));
        win.loadURL(
            url.format({
                pathname: path.join(ngDistDir, 'index.html'),
                protocol: "file:",
                slashes: true,
                //icon: path.join(__dirname, 'assets/icons/favicon.png')
            })
        );
    }

    win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
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
        if (win === null) {
            createWindow();
        }
    });

} catch (e) {
    // Catch Error
    // throw e;
}