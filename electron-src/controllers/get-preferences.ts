import { ipcMain, BrowserWindow, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { Preferences, User } from '../entity';

ipcMain.on('getPreferences', (event: IpcMainEvent) => {

    Settings.getConnection().then(async connection => {
      
        const repo = connection.getRepository(Preferences);

        let preferences = await repo.find();

        let formatted: { [k: string]: any } = {};

        preferences.forEach(record => {
            formatted[record.name] = record.value;
        })

        // Additional details
        if (formatted['FAV_USER']) {
            let userRepo = connection.getRepository(User);
            let user = await userRepo.findOne({ id: parseInt(formatted['FAV_USER']) });
            formatted['FAV_USER'] = user;
        }

        Settings.sendWebContent('getPreferencesResponse', 200, formatted)

    }).catch(Err => console.log(Err))

});