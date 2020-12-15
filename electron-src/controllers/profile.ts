import { ipcMain, BrowserWindow, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { User } from '../entity';
import { verify } from '../utils';

ipcMain.on('changePassword', (event: IpcMainEvent, { username, currentPassword, newPassword }) => {

  Settings.getConnection().then(async connection => {
    try {

      let userRepository = connection.getRepository(User);

        let user = await userRepository.findOne({ username: username });

        if (!user) {
            Settings.sendWebContent('changePasswordResponse', 400, 'Invalid user');
            return;
        }

        let passwordMatched = verify(currentPassword, user.password);

        if (!passwordMatched) {
            Settings.sendWebContent('changePasswordResponse', 400, 'Invalid current password');
            return;
        }

        user.setRawPassword(newPassword);

        await userRepository.save(user);


      Settings.sendWebContent('changePasswordResponse', 200, 'Password changed');
    } catch (err) {
      Settings.sendWebContent('changePasswordResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});