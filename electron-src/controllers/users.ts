import { ipcMain, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { User, Role } from '../entity';
import { print } from '../utils';


ipcMain.on('fetchUsersFormData', (params?: any) => {

  Settings.getConnection().then(async connection => {
    let roleRepository = connection.getRepository(Role);

    const roles = await roleRepository.find({ order: { name: 'ASC' }});

    Settings.sendWebContent('fetchUsersFormDataResponse', 200, roles);

  }).catch(Err => console.log(Err))

});

ipcMain.on('fetchUsers', (params?: any) => {

  Settings.getConnection().then(async connection => {
    let userRepository = connection.getRepository(User);

    const users = await userRepository.find({ order: { firstName: 'ASC' }, relations: ['role']});

    Settings.sendWebContent('fetchUsersResponse', 200, users);

  }).catch(Err => console.log(Err))

});
// Create new user
ipcMain.on('addNewUser', (event: IpcMainEvent, { username, password, role, firstName, lastName, email, phone }) => {

  Settings.getConnection().then(async connection => {

    let userRepository = connection.getRepository(User);

    let matches = await userRepository.find({ where: { username: username}, withDeleted: true });

    if (matches.length > 0) {
      Settings.sendWebContent('addNewUserResponse', 400, 'Username already exists');
      return;
    }

    let user = new User();
    user.username = username;
    user.setRawPassword(password);
    user.role = role;
    user.firstName = firstName;
    user.lastName = lastName
    user.email = email;
    user.phone = phone;

    let roleRepository = connection.getRepository(Role);
    let roleObj = await roleRepository.findOne({ id: role});

    switch(roleObj.name) {
      case "Admin": {
        user.avatar = 1;
        break;
      }
      case "Shopkeeper": {
        user.avatar = 32;
        break;
      }
    }

    await userRepository.save(user);


    Settings.sendWebContent('addNewUserResponse', 200, user)

  }).catch(Err => print(Err, 'danger'))

});


// Update user
ipcMain.on('updateUser', (event: IpcMainEvent, { id, username, role, firstName, lastName, email, phone, deleted }) => {

  Settings.getConnection().then(async connection => {

    let userRepository = connection.getRepository(User);

    let user = await userRepository.findOne({ id: id });

    if (!user) {
      Settings.sendWebContent('updateUserResponse', 400, 'User not found');
      return;
    }

    user.username = username;
    user.role = role;
    user.firstName = firstName;
    user.lastName = lastName
    user.email = email;
    user.phone = phone;
    user.deleted = deleted;

    let roleRepository = connection.getRepository(Role);
    let roleObj = await roleRepository.findOne({ id: role});

    switch(roleObj.name) {
      case "Admin": {
        user.avatar = 1;
        break;
      }
      case "Shopkeeper": {
        user.avatar = 32;
        break;
      }
    }


    await userRepository.save(user);

    Settings.sendWebContent('updateUserResponse', 200, user)

  }).catch(Err => print(Err, 'danger'))

});

// Update user
ipcMain.on('changeUserPassword', (event: IpcMainEvent, { id, newPassword }) => {

  Settings.getConnection().then(async connection => {

    let userRepository = connection.getRepository(User);

    let user = await userRepository.findOne({ id: id });

    if (!user) {
      Settings.sendWebContent('changeUserPasswordResponse', 400, 'User not found');
      return;
    }

    user.setRawPassword(newPassword);

    await userRepository.save(user);

    Settings.sendWebContent('changeUserPasswordResponse', 200, user)

  }).catch(Err => print(Err, 'danger'))

});

// Delete user
ipcMain.on('deleteUser', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {

    let userRepository = connection.getRepository(User);

    let user = await userRepository.findOne({ id: id });

    if (!user) {
      Settings.sendWebContent('deleteUserResponse', 400, 'User not found');
      return;
    }

    await userRepository.softDelete({ id: id });

    Settings.sendWebContent('deleteUserResponse', 200, 'deleted')

  }).catch(Err => print(Err, 'danger'))

});