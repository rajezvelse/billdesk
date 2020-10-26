import { ipcMain, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { Vendor } from '../entity';
import { print } from '../utils';

// List vendors
ipcMain.on('fetchVendors', (params?: any) => {

  Settings.getConnection().then(async connection => {
    let vendorRepository = connection.getRepository(Vendor);

    const vendors = await vendorRepository.find();

    Settings.sendWebContent('fetchVendorsResponse', 200, vendors);

  }).catch(Err => console.log(Err))

});


// Create new vendor
ipcMain.on('addNewVendor', (event: IpcMainEvent, { name, mobile, email, gstin, address }) => {

  Settings.getConnection().then(async connection => {

    let vendorRepository = connection.getRepository(Vendor);

    let vendor = new Vendor();
    vendor.name = name;
    vendor.mobile = mobile;
    vendor.email = email;
    vendor.gstin = gstin;
    vendor.address = address;

    await vendorRepository.save(vendor);


    Settings.sendWebContent('addNewVendorResponse', 200, vendor)

  }).catch(Err => print(Err, 'danger'))

});


// Update vendor
ipcMain.on('updateVendor', (event: IpcMainEvent, { id, name, mobile, email, gstin, address }) => {

  Settings.getConnection().then(async connection => {

    let vendorRepository = connection.getRepository(Vendor);

    let vendor = await vendorRepository.findOne({ id: id });

    if (!vendor) {
        Settings.sendWebContent('updateVendorResponse', 400, 'Vendor not found');
        return;
    }

    vendor.name = name;
    vendor.mobile = mobile;
    vendor.email = email;
    vendor.gstin = gstin;
    vendor.address = address;

    await vendorRepository.save(vendor);

    Settings.sendWebContent('updateVendorResponse', 200, vendor)

  }).catch(Err => print(Err, 'danger'))

});

// Delete vendor
ipcMain.on('deleteVendor', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {

    let vendorRepository = connection.getRepository(Vendor);

    let vendor = await vendorRepository.findOne({ id: id });

    if (!vendor) {
        Settings.sendWebContent('deleteVendorResponse', 400, 'Vendor not found');
        return;
    }

    await vendorRepository.softDelete({ id: id });

    Settings.sendWebContent('deleteVendorResponse', 200, 'deleted')

  }).catch(Err => print(Err, 'danger'))

});