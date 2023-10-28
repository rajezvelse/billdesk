import { ipcMain, BrowserWindow, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { User, Preferences, Role } from '../entity';
import { verify, print } from '../utils';

ipcMain.on('authenticate', (event: IpcMainEvent, { username, password }) => {

  Settings.getConnection().then(async connection => {

    let userRepository = connection.getRepository(User);

    let user = await userRepository.findOne({ where: { username: username }, relations: ['role'] });

    if (!user) {
      Settings.sendWebContent('authenticateResponse', 400, 'Invalid username');
      return;
    }

    let passwordMatched = verify(password, user.password);

    if (!passwordMatched) {
      Settings.sendWebContent('authenticateResponse', 400, 'Invalid password');
      return;

    }


    // Save favorite user preference
    let preferencesRepo = connection.getRepository(Preferences);

    let favUserPreference = await preferencesRepo.findOne({ where: { name: "FAV_USER" } });
    if (!favUserPreference) {
      favUserPreference = new Preferences();
      favUserPreference.name = "FAV_USER";
    }

    favUserPreference.value = user.id.toString();
    await preferencesRepo.save(favUserPreference);

    Settings.sendWebContent('authenticateResponse', 200, user)

  }).catch(Err => print(Err, 'danger'))

});