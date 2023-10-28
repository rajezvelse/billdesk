import { ipcMain, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { Customer } from '../entity';
import { print } from '../utils';

// List customers
ipcMain.on('fetchCustomers', (event: IpcMainEvent, { searchText }) => {

  Settings.getConnection().then(async connection => {
    let customerRepository = connection.getRepository(Customer);


    let query = customerRepository.createQueryBuilder('c')
      .select(['c.id, c.name, c.phone']);

    if (searchText) {
      query.where(`c.name LIKE '%${searchText}%'`);
      query.orWhere(`c.phone LIKE '%${searchText}%'`);
    }

    const customers = await query.getRawMany();

    Settings.sendWebContent('fetchCustomersResponse', 200, customers);

  }).catch(Err => console.log(Err))

});


// Create new customer
ipcMain.on('addNewCustomer', (event: IpcMainEvent, { name, phone }) => {

  Settings.getConnection().then(async connection => {

    let customerRepository = connection.getRepository(Customer);

    let customer = new Customer();
    customer.name = name;
    customer.phone = phone;

    await customerRepository.save(customer);


    Settings.sendWebContent('addNewCustomerResponse', 200, customer)

  }).catch(Err => print(Err, 'danger'))

});


// Update customer
ipcMain.on('updateCustomer', (event: IpcMainEvent, { id, name, phone }) => {

  Settings.getConnection().then(async connection => {

    let customerRepository = connection.getRepository(Customer);

    let customer = await customerRepository.findOne({ where: { id: id } });

    if (!customer) {
      Settings.sendWebContent('updateCustomerResponse', 400, 'Customer not found');
      return;
    }

    customer.name = name;
    customer.phone = phone;

    await customerRepository.save(customer);

    Settings.sendWebContent('updateCustomerResponse', 200, customer)

  }).catch(Err => print(Err, 'danger'))

});

// Delete customer
ipcMain.on('deleteCustomer', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {

    let customerRepository = connection.getRepository(Customer);

    let customer = await customerRepository.findOne({ where: { id: id } });

    if (!customer) {
      Settings.sendWebContent('deleteCustomerResponse', 400, 'Customer not found');
      return;
    }

    await customerRepository.softDelete({ id: id });

    Settings.sendWebContent('deleteCustomerResponse', 200, 'deleted')

  }).catch(Err => print(Err, 'danger'))

});