import { ConnectionOptions, ConnectionManager, Connection, getConnection } from 'typeorm';
import { app, BrowserWindow } from 'electron';
import * as path from 'path';

export class Settings {
    // Electron app main window object
    private static mainWindow: BrowserWindow = null;

    static setWindow(window: BrowserWindow) {
        Settings.mainWindow = window;
    }
    static getWindow(): BrowserWindow {
        return Settings.mainWindow;
    }

    // Database connection options
    static ormConfig: ConnectionOptions = {
        name: "default",
        type: "sqlite",
        database: path.join('/home/rajesh.velliangiri/.config/billdesk', 'storage', 'db.billdesk.sqlite'),
        synchronize: true,
        logging: false,
        entities: [
            path.join(__dirname, "entity/**/*")
        ],
        migrations: [
            path.join(__dirname, "migration/**/*")
        ],
        subscribers: [
            path.join(__dirname, "subscriber/**/*")
        ],
        cli: {
            entitiesDir: path.join(__dirname, "entity"),
            migrationsDir: path.join(__dirname, "migration"),
            subscribersDir: path.join(__dirname, "subscriber")
        }
    }
    private static connectionManager: ConnectionManager;

    // Obtaining database connection
    static getConnection(): Promise<Connection> {
        return new Promise((resolve, reject) => {

            if (!Settings.connectionManager) {
                Settings.connectionManager = new ConnectionManager();
                Settings.connectionManager.create(Settings.ormConfig);
            }

            // Retriving existing connection, If connected before
            if (Settings.connectionManager.get('default').isConnected) {
                resolve(Settings.connectionManager.get('default'));
                return;
            }

            // Creating new connection
            Settings.connectionManager.get('default').connect()
                .then(connection => resolve(connection)).catch(Error => {
                    console.log('DB connection error: ', Error);
                    reject(Error);
                });

        });
    }

    // Sending data to application UI
    static sendWebContent(event: string, status: number, data: any) {
        Settings.mainWindow.webContents.send(event, status, data);
    }


}