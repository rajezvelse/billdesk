# Electron_ReactJs_Sqlite Starter

This is a simple starter kit for developing electron applications with ReactJs & SQLite3. It is best suitable for beginners to quick initiate the project. [Electron Forge](https://www.electronforge.io/) is used for the building the electron app. So there is difficulties in managing the native dependencies for the electron application.

[TypeORM](https://typeorm.io/#/) is used for the database connectivity. It is such a nice tool for managing entities, fetching, writing data into the database. `IpcRenderer` from the electron is used to pass data between electron and angular.

## Directories

`src` - Reac application source code

`electron-src` - Electron application bootstrap configuration and entities, contollers.

`dist` - Source code compilation output

`out` - Final application build output

## Setup
```
git clone --branch electron-react-sqlite3  https://github.com/rajezvelse/billdesk.git
cd billdesk
npm install
```

## Dev

To run the development app start the React dev server in a terminal `npm run react:start -- --serve` and then start the electron application in another terminal `npm run electron:start`. The chnage detection is handled by the Angular development server.

## Dev test build

`npm run start`

## Linux deb build

`npm run make:deb` or `npm run make:rpm`

## Windows build

`npm run make:win`

#### Dependencies:

python2.7

git

npm install --global --production windows-build-tools


## References
[Electron](https://electronjs.org/)

[ReacJs](https://reactjs.org/)

[TypeORM](https://typeorm.io/#/)

