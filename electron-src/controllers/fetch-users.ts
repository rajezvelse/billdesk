import { ipcMain, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { User } from '../entity';

ipcMain.on('fetchUsers', (params?: any) => {

    Settings.getConnection().then(async connection => {
        let userRepository = connection.getRepository(User);

        const users = await userRepository.find();

        console.log('Response', users)
        Settings.sendWebContent('fetchUsersResponse', 200, users);

    }).catch(Err => console.log(Err))

});