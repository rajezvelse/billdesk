import { Connection } from 'typeorm';
import { Role, User } from '../entity';
import { print } from '../utils';

export const load = async (connection: Connection) => {

    // Cump admin user if not exists
    let userRepository = connection.getRepository(User);

    let adminUser = await userRepository.find({ username: 'admin' });

    if (adminUser.length == 0) {
        let roleRepository = connection.getRepository(Role);

        let adminRole = await roleRepository.findOne({ name: 'Admin' });
        const user = new User();

        user.username = 'admin';
        user.role = adminRole;
        user.setRawPassword('demo123');
        user.firstName = 'Administrator';
        user.email = 'admin@billdesk.com';
        user.avatar = 1;

        let adminUser = await userRepository.save(user);

        print(`Created new user : ${adminUser.username}`);
    } else {
        print('User enitity is upto date.')
    }

}