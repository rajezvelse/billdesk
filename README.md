# Electron_Angular8+_Sqlite Starter

This is a simple starter kit for developing electron applications with Angular & SQLite3. It is best suitable for beginners to quick initiate the project. [Electron Forge](https://www.electronforge.io/) is used for the building the electron app. So there is difficulties in managing the native dependencies for the electron application.

[TypeORM](https://typeorm.io/#/) is used for the database connectivity. It is such a nice tool for managing entities, fetching, writing data into the database. `IpcRenderer` from the electron is used to pass data between electron and angular.

## Directories

`src` - Angular application source code

`electron-src` - Electron application bootstrap configuration and entities, contollers.

`out-tsc` - Source code compilation output

`out` - Final application build output

## Setup
```
git clone --branch electron-ng8-sqlite3  https://github.com/rajezvelse/billdesk.git
cd billdesk
npm install
```

## Dev

To run the development app start the Angular server in a terminal `npm run start:ng` and then start the electron application in another terminal `npm run start:electron`. The chnage detection is handled by the Angular development server.

## Dev test build

`npm run start:electron-build`

## Linux deb build

`npm run make:linux`

## Windows build

`npm run make:win`

## References
[Electron](https://electronjs.org/)

[Angular](https://angular.io/)

[TypeORM](https://typeorm.io/#/)

