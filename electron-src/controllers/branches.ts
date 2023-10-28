import { ipcMain, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { Branch } from '../entity';
import { print } from '../utils';

// List vendors
ipcMain.on('fetchBranches', (params?: any) => {

  Settings.getConnection().then(async connection => {
    let vendorRepository = connection.getRepository(Branch);

    const vendors = await vendorRepository.find();

    Settings.sendWebContent('fetchBranchesResponse', 200, vendors);

  }).catch(Err => console.log(Err))

});


// Create new vendor
ipcMain.on('addNewBranch', (event: IpcMainEvent, { name, phone, email, gstin, address }) => {

  Settings.getConnection().then(async connection => {

    let vendorRepository = connection.getRepository(Branch);

    let vendor = new Branch();
    vendor.name = name;
    vendor.phone = phone;
    vendor.address = address;

    await vendorRepository.save(vendor);


    Settings.sendWebContent('addNewBranchResponse', 200, vendor)

  }).catch(Err => print(Err, 'danger'))

});


// Update vendor
ipcMain.on('updateBranch', (event: IpcMainEvent, { id, name, phone, email, gstin, address }) => {

  Settings.getConnection().then(async connection => {

    let vendorRepository = connection.getRepository(Branch);

    let vendor = await vendorRepository.findOne({ where: { id: id } });

    if (!vendor) {
      Settings.sendWebContent('updateBranchResponse', 400, 'Branch not found');
      return;
    }

    vendor.name = name;
    vendor.phone = phone;
    vendor.address = address;

    await vendorRepository.save(vendor);

    Settings.sendWebContent('updateBranchResponse', 200, vendor)

  }).catch(Err => print(Err, 'danger'))

});

// Delete vendor
ipcMain.on('deleteBranch', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {

    let vendorRepository = connection.getRepository(Branch);

    let vendor = await vendorRepository.findOne({ where: { id: id } });

    if (!vendor) {
      Settings.sendWebContent('deleteBranchResponse', 400, 'Branch not found');
      return;
    }

    await vendorRepository.softDelete({ id: id });

    Settings.sendWebContent('deleteBranchResponse', 200, 'deleted')

  }).catch(Err => print(Err, 'danger'))

});