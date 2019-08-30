import { ipcMain, BrowserWindow } from 'electron';
import { mainWindow } from '../electron.main';
import { getConnection } from '../db.connection';
import { User } from '../entity/User';

ipcMain.on('fetchUsers', (params?: any) => {
    getConnection().then(async connection => {

        const users = await connection.manager.find(User);

        if(users.length == 0){
            const user = new User();
            user.firstName = "Timber";
            user.lastName = "Saw";
            user.age = 25;
            await connection.manager.save(user);
            
            
            const user2 = new User();
            user2.firstName = "Mousik";
            user2.lastName = "Saw";
            user2.age = 22;
            await connection.manager.save(user2);
        }

        console.log('Response', users)
        mainWindow.webContents.send('fetchUsersResponse', users)
        
    }).catch(Err => console.log(Err))

});