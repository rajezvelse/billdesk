import { ipcMain, BrowserWindow, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { Preferences } from '../entity';
import { print } from '../utils';

ipcMain.on('setPreferences', (event: IpcMainEvent, { preferencesData }) => {

  Settings.getConnection().then(async connection => {
    const repo = connection.getRepository(Preferences);

    let preferences = await repo.find({
      where: {
        name: Object.keys(preferencesData)
      }
    });

    let map: any = {}, updatedRecords: Preferences[] = [];
    preferences.forEach(record => {
      map[record.name] = record;
    })

    Object.keys(preferencesData).forEach((name) => {
      if(name in map){
        let record = map[name];
        record.value = preferencesData[name];
        updatedRecords.push(record);
      }
      else {
        let record = new Preferences();
        record.name = name;
        record.value = preferencesData[name];
        
        updatedRecords.push(record);
      }
    })

    await repo.save(updatedRecords);


    let formatted: { [k: string]: any } = {};

    updatedRecords.forEach(record => {
      formatted[record.name] = record.value;
    })

    Settings.sendWebContent('setPreferencesResponse', 200, formatted)

  }).catch(Err => console.log(Err))

});