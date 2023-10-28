import { DataSource, DataSourceOptions } from 'typeorm';
import { app, BrowserWindow } from 'electron';
import * as path from 'path';

const homedir = require('os').homedir();

export class Settings {
  // Electron app main window object
  private static mainWindow: BrowserWindow | null = null;

  static setWindow(window: BrowserWindow) {
    Settings.mainWindow = window;
  }
  static getWindow(): BrowserWindow | null {
    return Settings.mainWindow;
  }

  // Database connection options
  static datasoruceConfig: DataSourceOptions = {
    name: "default",
    type: "sqlite",
    database: path.join(homedir, 'billdesk', 'storage', 'db.billdesk.sqlite'),
    logging: false,
    synchronize: false,
    migrationsTableName: "migrations",
    entities: [
      path.join(__dirname, "entity/**/*")
    ],
    migrations: [
      path.join(__dirname, "migration/**/*")
    ],
    subscribers: [
      path.join(__dirname, "subscriber/**/*")
    ],
    // cli: {
    //     entitiesDir: path.join(__dirname, "entity"),
    //     migrationsDir: path.join(__dirname, "migration"),
    //     subscribersDir: path.join(__dirname, "subscriber")
    // }
  }
  private static dataSource: DataSource;

  // Obtaining database connection
  static getConnection(): Promise<DataSource> {
    return new Promise((resolve, reject) => {

      if (!Settings.dataSource) {
        let dataSource = new DataSource(Settings.datasoruceConfig);

        dataSource.initialize()
          .then(() => {
            console.log("Data Source has been initialized!")
            Settings.dataSource = dataSource
            resolve(Settings.dataSource)
          })
          .catch((err) => {
            console.error("Error during Data Source initialization", err)
            reject(err)
          })

      } else
        // Retriving existing connection, If connected before
        resolve(Settings.dataSource)

    });
  }

  // Sending data to application UI
  static sendWebContent(event: string, status: number, data: any) {
    Settings.mainWindow?.webContents.send(event, status, data);
  }


}