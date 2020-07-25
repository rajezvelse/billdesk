
import { Connection } from 'typeorm';
import { Role } from '../entity';
import { print } from '../utils';
import { RolePermissions } from '../constants';

export const load = async (connection: Connection) => {

    // Insert admin role if not exists
    let roleRepository = connection.getRepository(Role);

    let adminRole = await roleRepository.find({ name: 'Admin' });

    if (adminRole.length == 0) {

        const role = new Role();

        role.name = 'Admin';
        role.description = 'Super user role with all privileges';
        role.deletable = false;

        let allPermissions = Object.values(RolePermissions).reduce((groupPermissions, result) => result.concat(groupPermissions), []);
        role.permissions = allPermissions;

        let adminRole = await roleRepository.save(role);

        print(`Created new role : ${adminRole.name}`);
    } else {
        print('Role enitity is upto date.')
    }
}