
import { Connection } from 'typeorm';
import { Role } from '../entity';
import { print } from '../utils';
import { RolePermissions } from '../constants';

export const load = async (connection: Connection) => {

  const shopkeeperPermissions: string[] = [
    'Sales',
    'SalesPayments',
    'ProductCategories',
    'Brands', 'Products',
    'Customers',
    'Stocks',
    'Scraps'
  ];
  // Insert admin role if not exists
  let roleRepository = connection.getRepository(Role);

  let adminRole = await roleRepository.find({ name: 'Admin' });
  let shopKeeperRole = await roleRepository.find({ name: 'Shopkeeper' });

  if (adminRole.length == 0) {

    let role = new Role();

    role.name = 'Admin';
    role.description = 'Super user role with all privileges';
    role.deletable = false;

    let allPermissions: any = Object.values(RolePermissions).reduce((groupPermissions, result) => result.concat(groupPermissions), []);
    role.permissions = allPermissions;

    let saved = await roleRepository.save(role);

    print(`Created new role : ${saved.name}`);


  } else {
    let role = adminRole[0];

    let allPermissions: any = Object.values(RolePermissions).reduce((groupPermissions, result) => result.concat(groupPermissions), []);
    role.permissions = allPermissions;

    let saved = await roleRepository.save(role);

    print(`Updated role : ${saved.name}`);
  }


  if (shopKeeperRole.length == 0) {

    let role = new Role();

    role.name = 'Shopkeeper';
    role.description = 'Shopkeeper role with limited access';
    role.deletable = false;


    let allPermissions: any = [];

    shopkeeperPermissions.forEach((value: string) => {
      allPermissions = allPermissions.concat(RolePermissions[value]);
    })

    role.permissions = allPermissions;

    let saved = await roleRepository.save(role);

    print(`Created new role : ${saved.name}`);


  } else {
    let role = shopKeeperRole[0];

    let allPermissions: any = [];

    shopkeeperPermissions.forEach((value: string) => {
      allPermissions = allPermissions.concat(RolePermissions[value]);
    })

    role.permissions = allPermissions;

    let saved = await roleRepository.save(role);

    print(`Updated role : ${saved.name}`);
  }



}