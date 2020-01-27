import { ipcMain, BrowserWindow, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { User } from '../entity';
import { verify } from '../utils';

ipcMain.on('authenticate', (event: IpcMainEvent, username: string, password: string) => {

    Settings.getConnection().then(async connection => {
        let userRepository = connection.getRepository(User);

        const user = await userRepository.findOne({ username: username });

        if (!user) {
            Settings.sendWebContent('authenticateResponse', 400, 'Invalid username/password');
            return;
        }

        let passwordMatched = verify(password, user.password);

        if (!passwordMatched) {
            Settings.sendWebContent('authenticateResponse', 400, 'Invalid username/password');
            return;

        }

        Settings.sendWebContent('authenticateResponse', 200, user)

    }).catch(Err => console.log(Err))

});